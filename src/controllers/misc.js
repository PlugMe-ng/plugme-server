import { Op } from 'sequelize';
import crypto from 'crypto';
import moment from 'moment';
import sgClient from '@sendgrid/client';
import isEmail from 'validator/lib/isEmail';

import models from '../models';
import helpers, { cache } from '../helpers';
import config from '../config';

sgClient.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * @class Controller
 */
export default new class {
  PROFESSIONAL_DIRECTIONS_CACHE_KEY = 'professional_directions'
  PROFESSIONAL_DIRECTIONS_LOG_NAME = 'Professional Direction'

  /**
   * Retrieves admin actions logs
   *
   * @param {object} req - Express Request Object
   * @param {object} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Controller
   */
  getAdminLogs = async (req, res) => {
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;
    const { where: filter } = req.meta.filter;
    const { query } = req.meta.search;

    const where = {
      ...(query && { action: { [Op.iLike]: `%${query}%` } }),
      ...(filter.createdAt && { createdAt: { [Op.between]: filter.createdAt.split(',') } })
    };

    try {
      const logs = await models.adminAction.findAndCountAll({
        limit,
        offset,
        where,
        order: [[attribute, order]],
        include: [{
          model: models.User,
          attributes: ['id', 'fullName', 'username'],
          where: {
            ...(filter.user && {
              [Op.or]: [
                { username: { [Op.iLike]: `%${filter.user}%` } },
                { fullName: { [Op.iLike]: `%${filter.user}%` } }
              ]
            })
          }
        }]
      });
      const pagination = helpers.Misc
        .generatePaginationMeta(req, logs, limit, offset);
      return res.sendSuccess(logs.rows, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles setting the platform backgrounds
   *
   * @param {object} req - Express Request Object
   * @param {object} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Controller
   */
  setBackgrounds = async (req, res) => {
    try {
      await cache.hmset('backgrounds', req.body);
      return res.sendSuccess({ message: 'Background successfully updated' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles retrieving the platform backgrounds
   *
   * @param {object} req - Express Request Object
   * @param {object} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Controller
   */
  getBackgrounds = async (req, res) => {
    try {
      const backgrounds = await cache.hgetall('backgrounds');
      return res.sendSuccess(backgrounds || {});
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @desc Handles user plan subscription as a webhook from Paystack
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  handleUserSubscription = async (req, res) => {
    const authHash = crypto.createHmac('sha512', config.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body)).digest('hex');
    if (authHash !== req.headers['x-paystack-signature']) return res.status(401).end();

    res.status(200).end();
    switch (req.body.event) {
      case 'charge.success':
      case 'subscription.create': {
        const { amount, customer: { email } } = req.body.data;
        const { name, validity } = helpers.Misc
          .subscriptionPlans
          .getPlanFromAmount(Number(amount / 100));
        return models.User.update({
          plan: { type: name, expiresAt: moment().add(...validity).valueOf() },
        }, { where: { email } });
      }
      default:
        break;
    }
  }

  /**
   * @desc Handles newsletter subscription
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  subscribeNewsletterRecipient = async (req, res) => {
    const { email } = req.body;
    try {
      if (!email || !isEmail(email)) throw new Error('Please input a valid email');
      await sgClient.request({
        method: 'POST',
        url: '/v3/contactdb/recipients',
        body: [{ email }]
      });
      return res.sendSuccess({ message: 'Success' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handler for adding new professional direction (for opportunities) by admin.
   *
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Object
   *
   * @returns {void}
   */
  addProfessionalDirection = async (req, res) => {
    if (!req.body.title || req.body.title.trim().length === 0) {
      return res.sendFailure(["Invalid value specified for key 'title'"]);
    }
    const result = await cache.sadd(this.PROFESSIONAL_DIRECTIONS_CACHE_KEY, req.body.title);
    if (result === 0) return res.sendFailure([`'${req.body.title}' already exists`]);
    return res.sendSuccessAndLog({
      name: this.PROFESSIONAL_DIRECTIONS_LOG_NAME,
      title: req.body.title
    }, {
      message: `Successfully added '${req.body.title}' to professional directions`
    });
  }

  /**
   * Handler for getting professional directions to create new opportunities.
   *
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Object
   *
   * @returns {void}
   */
  getProfessionalDirections = async (req, res) => {
    const professionalDirections = await cache.smembers(this.PROFESSIONAL_DIRECTIONS_CACHE_KEY);
    return res.sendSuccess(professionalDirections);
  }

  /**
   * Handler for removing a professional direction by admin.
   *
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Object
   *
   * @returns {void}
   */
  deleteProfessionalDirection = async (req, res) => {
    const { title } = req.params;
    const result = await cache.srem(this.PROFESSIONAL_DIRECTIONS_CACHE_KEY, title);
    if (result === 0) return res.sendFailure([`${title} does not exist in professional directions`]);
    return res.sendSuccessAndLog({
      name: this.PROFESSIONAL_DIRECTIONS_LOG_NAME,
      title
    }, {
      message: `Successfully deleted '${title}' from professional directions`
    });
  }

  /**
   * Handler for modifying a professional direction by admin.
   *
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Object
   *
   * @returns {void}
   */
  editProfessionalDirection = async (req, res) => {
    const { title } = req.params;
    if (!req.body.title || req.body.title.trim().length === 0) {
      return res.sendFailure(["Invalid value specified for key 'title'"]);
    }
    const result = await cache.srem(this.PROFESSIONAL_DIRECTIONS_CACHE_KEY, title);
    if (result === 0) return res.sendFailure([`'${title}' does not exist in professional directions`]);
    await cache.sadd(this.PROFESSIONAL_DIRECTIONS_CACHE_KEY, req.body.title);
    return res.sendSuccessAndLog({
      name: this.PROFESSIONAL_DIRECTIONS_LOG_NAME,
      prevValue: title,
      newValue: req.body.title
    }, {
      message: `Successfully edited '${title}'`,
      prevValue: title,
      newValue: req.body.title
    });
  }
}();
