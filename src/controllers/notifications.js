import models from '../models';
import { notifsIO } from '../server';
import helpers from '../helpers';

export const events = {
  LIKE: 'like',
  COMMENT: 'comment',
  OPPORTUNITY_APPLICATION: 'opportunity_application',
  OPPORTUNITY_ACHIEVER_SET: 'opportunity_achiever_set',
  OPPORTUNITY_REVIEW: 'opportunity_review'
};

const eventDescriptions = {
  like: 'liked your content',
  comment: 'commented on your content',
  opportunity_application: 'has plugged to an opportunity you uploaded',
  opportunity_achiever_set: 'has selected opportunity achiever',
  opportunity_review: 'has reviewed your opportunity'

};

const generateMeta = (event, entity) => {
  const meta = {};
  meta[entity.constructor.name.toLowerCase()] = entity.id;
  meta.event = event;
  meta.text = eventDescriptions[event];
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
    try {
      const meta = generateMeta(event, entity);
      recipients.forEach((recipientId) => {
        models.notification.create({
          authorId: author ? author.id : null,
          userId: recipientId,
          meta
        });
        notifsIO.send('notification', recipientId);
      });
    } catch (error) {
      // TODO: fail silently for now
    }
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
