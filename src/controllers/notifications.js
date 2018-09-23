import moment from 'moment';

import models from '../models';
import { notifsIO } from '../server';
import helpers from '../helpers';
import sendMail from '../helpers/mailing';
import config from '../config';

export const events = {
  LIKE: 'like',
  COMMENT: 'comment',
  OPPORTUNITY_APPLICATION: 'opportunity_application',
  OPPORTUNITY_ACHIEVER_SET: 'opportunity_achiever_set',
  OPPORTUNITY_ACHIEVER_SET_OTHERS: 'opportunity_achiever_set_others',
  OPPORTUNITY_REVIEW: 'opportunity_review',
  NEW_MESSAGE: 'new_message',
  NEW_FAN: 'new_fan',
  NEW_CONTENT: 'new_content',
  CONTENT_DELETE: 'content_delete',
  OPPORTUNITY_DELETE: 'opportunity_delete',
  NEW_OPPORTUNITY: 'new_opportunity',
  SUBSCRIPTION_END: 'subscription_end'
};

const eventDescriptions = {
  like: 'liked your content',
  comment: 'commented on your content',
  opportunity_application: 'has plugged to an opportunity you uploaded',
  opportunity_achiever_set: 'has plugged you to an opportunity',
  opportunity_achiever_set_others: 'You were not plugged to this opportunity',
  opportunity_review: 'has reviewed your opportunity',
  new_message: 'messaged you',
  new_fan: 'is now a fan of yours',
  new_content: 'has published a new content',
  new_opportunity: 'has uploaded a new opportuntity',
  content_delete: 'Content deleted by admin',
  opportunity_delete: 'Opportunity deleted by admin',
  subscription_end: 'Your subscription will expire in 5 days, please renew your subscription'
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
  }),

  new_opportunity: (author, recipient, entity) => ({
    subject: 'New opportunity is available',
    content:
    `
    <p>Hi ${recipient.fullName}</p>

    <p>A new <a href="${config.FE_URL}/${author.username}/opportunity/${entity.id}">opportunity</a> that match your skills tag has been uploaded.</p>

    <p>Hurry now to apply for this opportuntiy before it passes.</p>
    `,
    address: recipient.email
  }),

  subscription_end: (author, recipient, entity) => ({
    subject: 'Your current subscription will expire in 5 days',
    content:
    `
    <p>Hi ${recipient.fullName}</p>

    <p>Your current subscription plan will expire in 5 days, after which you will no longer be able to upload contents or get plugged to new opportunities</p>

    <p>Please renew or upgrade your plan as soon as possible</p>
    `,
    address: recipient.email
  })
};

const generateMeta = (event, entity) => {
  const meta = {};
  const entityName = entity.constructor.name.toLowerCase();

  meta.event = event;
  meta[entityName] = entity.id;
  meta.text = eventDescriptions[event];

  return meta;
};

const sendEmailNotification = ({
  recipientId, event, author, entity
}) => {
  models.User.findById(recipientId, { attributes: ['email', 'fullName'] })
    .then(user => sendMail(generateEventMailPayload[event](author, user, entity)));
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
      recipients.forEach(async (recipientId) => {
        if (author && recipientId === author.id) return;
        if (await isDuplicateNotif({ event, recipientId, author })) return;
        if (includeEmail) sendEmailNotification({ recipientId, event, author, entity }); // eslint-disable-line

        const meta = generateMeta(event, entity);
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
