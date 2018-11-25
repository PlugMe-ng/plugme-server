import models from '../models';
import { notifsIO } from '../server';
import sendMail from '../helpers/mailing';
import helpers, { events, eventDescriptions, generateNotifMailPayload } from '../helpers';

/**
 * Generates meta data for a notification to be stored in the db
 *
 * @param {any} event
 * @param {any} [entity]
 * @returns {Object} - an object including the event type, id of database entity on which event is
 * triggered and a more detailed description
 */
const generateMeta = (event, entity) => {
  const meta = {};
  if (entity) meta[entity.constructor.name.toLowerCase()] = entity.id;
  meta.event = event;
  meta.text = eventDescriptions[event];

  return meta;
};

const sendEmailNotification = ({
  recipientId, event, author, entity
}) =>
  models.User
    .findByPk(recipientId, { attributes: ['email', 'fullName'] })
    .then(recipient =>
      sendMail(generateNotifMailPayload({
        event, author, entity, recipient
      })));

const isDuplicateNotif = async ({ event, recipientId, author }) => {
  switch (event) {
    case events.NEW_FAN:
    case events.COMMENT:
    case events.NEW_CONTENT: {
      return !!(await models.notification.findOne({
        attributes: [],
        order: [['createdAt', 'DESC']],
        where: {
          authorId: author.id,
          userId: recipientId,
          read: false,
          'meta.event': event,
        }
      }));
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
   * @param {Array.<string>} payload.recipients - an array of recipientIds of the event
   * @param {Object} [payload.entity] - action object
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
      const userNotifs = await models.notification.findAndCountAll({
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
    const id = req.params.notificationId || req.body.ids;

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
