import moment from 'moment';

import models from '../models';
import { notifsIO } from '../server';
import sendMail from '../helpers/mailing';
import helpers, { events, eventDescriptions, generateEventMailPayload } from '../helpers';

const generateMeta = (event, entity) => {
  const meta = {};
  if (entity) meta[entity.constructor.name.toLowerCase()] = entity.id;
  meta.event = event;
  meta.text = eventDescriptions[event];

  return meta;
};

const sendEmailNotification = ({
  recipientId, event, author, entity
}) => {
  models.User.findById(recipientId, { attributes: ['email', 'fullName'] })
    .then(recipient => sendMail(generateEventMailPayload[event](author, recipient, entity)));
};

const isDuplicateNotif = async ({ event, recipientId, author }) => {
  switch (event) {
    case events.NEW_MESSAGE: {
      const unreadMessageNotif = await models.notification.findOne({
        attributes: [],
        order: [['createdAt', 'DESC']],
        where: {
          userId: recipientId,
          read: false,
          authorId: author.id,
          'meta.event': event
        }
      });
      return !!unreadMessageNotif;
    }
    case events.SUBSCRIPTION_END: {
      const subcriptionEndNotifExists = await models.notification.findOne({
        attributes: [],
        order: [['createdAt', 'DESC']],
        where: {
          userId: recipientId,
          'meta.event': event,
          createdAt: {
            [models.sequelize.Op.lte]: moment().toDate(),
            [models.sequelize.Op.gte]: moment().subtract(5, 'days').toDate()
          }
        }
      });
      return !!subcriptionEndNotifExists;
    }
    default:
      return false;
  }
};

export default new class {
  /**
   * @param {Object} payload
   * @param {Object} payload.author - triggerer of the event
   * @param {string} payload.event - type of event triggered
   * @param {Array.<string>} payload.recipients - an array of recipientIds of
   * the event
   * @param {Object} payload.entity - action object
   * @param {boolean} [payload.includeEmail] - include email notification
   *
   * @returns {void}
   */
  create = ({
    author,
    event,
    recipients,
    entity,
    includeEmail = false
  }) => {
    recipients.forEach(async (recipientId) => {
      if (author && recipientId === author.id) return;
      if (await isDuplicateNotif({ event, recipientId, author })) return;
      if (includeEmail) sendEmailNotification({ recipientId, event, author, entity }); // eslint-disable-line

      models.notification.create({
        authorId: author ? author.id : null,
        userId: recipientId,
        meta: generateMeta(event, entity)
      });
      notifsIO.send('notification', recipientId);
    });
  }

  get = async (req, res) => {
    const userId = req.user.id;
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;

    try {
      const userNotifs = await models.notification.findAndCount({
        distinct: true,
        limit,
        offset,
        where: { userId },
        order: [[attribute, order]],
        include: [{
          model: models.User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'photo'],
          include: [{
            model: models.occupation,
            attributes: ['title']
          }]
        }]
      });
      const pagination = helpers.Misc
        .generatePaginationMeta(req, userNotifs, limit, offset);
      return res.sendSuccess(userNotifs.rows, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  update = async (req, res) => {
    const id = req.params.notificationId;

    try {
      await models.notification.update(
        { read: true },
        { where: { id } }
      );
      return res.sendSuccess();
    } catch (error) {
      return res.sendSuccess([error.message]);
    }
  }
}();
