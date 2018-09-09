import models from '../models';
import notifications, { events } from './notifications';
import { notifsIO } from '../server';

const createConversation = async (users) => {
  const conversation = await models.conversation.create();
  await conversation.setParticipants(users);
  return conversation.id;
};

const getUsersConversation = async (usersIds) => {
  const conversation = (await models.users_conversations.find({
    group: ['conversationId'],
    attributes: [
      'conversationId',
      [models.sequelize.fn('count', models.sequelize.col('conversationId')), 'count']
    ],
    where: { participantId: usersIds },
    having: models.sequelize.where(models.sequelize.fn('count', models.sequelize.col('conversationId')), {
      [models.sequelize.Op.eq]: usersIds.length,
    })
  }));

  const conversationId = conversation ?
    conversation.conversationId : await createConversation(usersIds);
  return conversationId;
};

export default new class {
  create = async (socket) => {
    const { user } = socket.request;

    socket.on('messaging', async ({
      recipients, conversationId, limit = 20, offset = 0
    }) => {
      if (!conversationId) {
        conversationId = await getUsersConversation([user.id, ...recipients]);
      }
      const messages = await models.message.findAndCount({
        limit,
        offset,
        where: { conversationId },
        order: [['createdAt', 'asc']]
      });
      socket.emit('messaging', {
        messages: messages.rows,
        conversationId,
        pagination: {
          total: messages.count,
          limit,
          offset
        }
      });
    });

    socket.on('new_message', async (message) => {
      message = await models.message.create({ ...message, senderId: user.id });
      this.notifyRecipients(user, message);
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
