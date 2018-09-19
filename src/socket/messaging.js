import moment from 'moment';

import models from '../models';
import notifications, { events } from '../controllers/notifications';
import { notifsIO } from '../server';
import config from '../config';

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
  const conversations = (await models.users_conversations.findAll({
    group: ['conversationId'],
    attributes: ['conversationId'],
    where: { participantId: users },
    include: [{
      model: models.conversation,
      attributes: [],
      required: true
    }],
    having: where(fn('COUNT', (fn('DISTINCT', col('participantId')))), { [Op.eq]: users.length })
  })).map(conversation => conversation.conversationId);
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
 * @returns {string} - conversationId
 */
const findOrCreateConversation = async (users) => {
  const participants = Array.from(new Set(users)).sort();
  if (participants.length < 2) throw new Error('Not enough participants');

  const conversations = await getUsersConversations(participants);
  return conversations.length ? conversations : createConversation(participants);
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
    throw new Error('Please renew your current subscription to perform this action');
  }
};

export default new class {
  create = async (socket) => {
    const { user } = socket.request;

    socket.on('messaging', async ({
      recipients, conversationId, limit = 20, offset = 0
    }) => {
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
      } catch (error) {
        socket.emit('error_messaging', [error.message]);
      }
    });

    socket.on('new_message', async (message) => {
      try {
        checkPermissions(user);
        message = await models.message.create({ ...message, senderId: user.id });
        await this.notifyRecipients(user, message);
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
          attributes: ['id']
        }]
      })).participants.map((participant) => {
      notifsIO.send('new_message', participant.id, message);
      return participant.id;
    });
    notifications.create(user, {
      event: events.NEW_MESSAGE, recipients, entity: message
    });
  }
}();
