import moment from 'moment';

import models from '../models';
import { notifications } from '../controllers';
import { notifsIO } from '../server';
import config from '../config';
import { events } from '../helpers';

const {
  where, fn, col, Op
} = models.sequelize;

const createConversation = async (users) => {
  const conversation = await models.conversation.create();
  await conversation.setParticipants(users);
  return [conversation.id];
};

/**
 * Finds the common conversationId(s) of the specified participants
 *
 * NOTE: same participants may have multiple conversationIds in rare cases
 *
 * @param {Array.<string>} users - ids of conversation participants
 * @returns {string} - conversationId
 */
const getUsersConversations = async (users) => {
  const conversations = (await models.conversation.findAll({
    order: [['createdAt', 'DESC']],
    includeIgnoreAttributes: false,
    group: ['conversation.id'],
    having: where(fn('COUNT', (fn('DISTINCT', col('participants.id')))), { [Op.eq]: users.length }),
    include: [{
      model: models.User,
      as: 'participants',
      required: true,
      attributes: [],
      through: {
        attributes: [],
        where: { participantId: users }
      },
    }]
  })).map(conversation => conversation.id);
  // Temporary: for testing
  if (conversations.length > 1) notifsIO.io.emit(config.dev_support_notif, conversations);
  return conversations;
};

/**
 * Finds or creates the common conversationId(s) of the specified participants
 *
 * NOTE: same participants may have multiple conversationIds in rare cases
 *
 * @param {Array.<string>} users - ids of conversation participants
 * @returns {Array.<string>} - conversationId
 */
const findOrCreateConversation = async (users) => {
  const participants = Array.from(new Set(users)).sort();
  if (participants.length < 2) throw new Error('Not enough participants');

  let conversations = await getUsersConversations(participants);
  if (conversations.length === 0) conversations = await createConversation(participants);
  return conversations;
};

/**
 * Handles user permissions
 * @param {any} user
 *
 * @returns {void}
 */
const checkPermissions = (user) => {
  const userPlanHasExpired = user.plan.expiresAt &&
        moment(user.plan.expiresAt).isBefore(moment.now());
  if (userPlanHasExpired) {
    throw new Error('Please renew your subscription to perform this action');
  }
};

export default new class {
  create = async (socket) => {
    const { user } = socket.request;
    socket.messaging = { inProgress: false }; // trying to prevent race condition

    socket.on('messaging', async ({
      recipients, conversationId, limit = 20, offset = 0
    }) => {
      if (socket.messaging.inProgress) return;
      socket.messaging.inProgress = true;
      try {
        checkPermissions(user);
        const conversations = conversationId ? [conversationId]
          : await findOrCreateConversation([user.id, ...recipients]);
        const messages = await models.message.findAndCount({
          limit,
          offset,
          where: { conversationId: conversations },
          order: [['createdAt', 'asc']]
        });
        socket.emit('messaging', {
          messages: messages.rows,
          conversationId: conversations[0],
          pagination: {
            total: messages.count,
            limit,
            offset
          }
        });
        socket.messaging.inProgress = false;
      } catch (error) {
        socket.emit('error_messaging', [error.message]);
        socket.messaging.inProgress = false;
      }
    });

    socket.on('new_message', async (message) => {
      try {
        checkPermissions(user);
        message = await models.message.create({ ...message, senderId: user.id });
        this.notifyRecipients(user, message);
      } catch (error) {
        socket.emit('error_messaging', [error.message]);
      }
    });
  }

  notifyRecipients = async (user, message) => {
    const recipients = (await models.conversation
      .findById(message.conversationId, {
        attributes: [],
        include: [{
          model: models.User,
          as: 'participants',
          attributes: ['id'],
          through: { attributes: [] }
        }]
      })).participants.map(participant => participant.id);

    recipients.forEach((recipient) => { notifsIO.send('new_message', recipient, message); });
    notifications.create({
      author: user, event: events.NEW_MESSAGE, recipients, entity: message
    });
  }
}();
