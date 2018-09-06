import models from '../models';
import { notifsIO } from '../server';
import helpers from '../helpers';

export const events = {
  LIKE: 'like',
  COMMENT: 'comment',
};

const eventFunctions = {
  like: user => `${user} liked your content`,
  comment: user => `${user} commented on your content`,
};

const generateMeta = (author, event, entity) => {
  const meta = {};
  meta[entity.constructor.name.toLowerCase()] = entity.id;
  meta.event = event;
  meta.text = eventFunctions[event](author ? author.username : null);
  return meta;
};

export default new class {
  /**
   * @param {Object} author - triggerer of the event
   * @param {Object} payload
   * @param {string} payload.event - type of event triggered
   * @param {Array.<string>} payload.recipients - an array of recipientIds of
   * the event
   * @param {Object} payload.entity - action object
   *
   * @returns {void}
   */
  create = (author, { event, recipients, entity }) => {
    const meta = generateMeta(author, event, entity);
    recipients.forEach((recipientId) => {
      models.notification.create({
        authorId: author ? author.id : null,
        userId: recipientId,
        meta
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
        order: [['read', 'asc'], [attribute, order]],
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
