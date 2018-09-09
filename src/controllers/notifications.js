import models from '../models';
import { notifsIO } from '../server';
import helpers from '../helpers';
import { sendMail } from '../helpers/auth';
import config from '../config';

export const events = {
  LIKE: 'like',
  COMMENT: 'comment',
  OPPORTUNITY_APPLICATION: 'opportunity_application',
  OPPORTUNITY_ACHIEVER_SET: 'opportunity_achiever_set',
  OPPORTUNITY_ACHIEVER_SET_OTHERS: 'opportunity_achiever_set_others',
  OPPORTUNITY_REVIEW: 'opportunity_review',
  NEW_MESSAGE: 'new_message'
};

const eventDescriptions = {
  like: 'liked your content',
  comment: 'commented on your content',
  opportunity_application: 'has plugged to an opportunity you uploaded',
  opportunity_achiever_set: 'has plugged you to an opportunity',
  opportunity_achiever_set_others: 'You were not plugged to this opportunity',
  opportunity_review: 'has reviewed your opportunity',
  new_message: 'messaged you'
};

const generateEventMailPayload = {
  opportunity_achiever_set: (author, recipient, entity) => ({
    subject: 'You have been plugged to an opportunity',
    content:
      `
      <p>Hi ${recipient.fullName},</p>

      <p>You have been PLUGGED to this <a href="${config.FE_URL}/opportunity/${author.username}/${entity.id}">opportunity</a> and will be duly contacted by the Plugger for further information</p>
      `,
    address: recipient.email
  }),

  opportunity_achiever_set_others: (author, recipient, entity) => ({
    subject: 'You were not plugged to an opportunity',
    content:
      `
      <p>Hi ${recipient.fullName}</p>

      <p>Unfortunately, you were not plugged to this <a href="${config.FE_URL}/${author.username}/opportunity/${entity.id}">opportunity</a></p>

      <p>There are more opportunities waiting for you on <a href="${config.FE_URL}">PlugMe</a> however</p>
      `,
    address: recipient.email
  })
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
   * @param {boolean} [payload.includeEmail] - include email notification
   *
   * @returns {void}
   */
  create = (author, {
    event,
    recipients,
    entity,
    includeEmail = false
  }) => {
    try {
      if (includeEmail) {
        recipients.forEach((recipientId) => {
          models.User.findById(recipientId, { attributes: ['email', 'fullName'] })
            .then(recipient =>
              sendMail(generateEventMailPayload[event](author, recipient, entity)));
        });
      }
      const meta = generateMeta(event, entity);
      recipients.forEach((recipientId) => {
        if (author && recipientId === author.id) return;
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
