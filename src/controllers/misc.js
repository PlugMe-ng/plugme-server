import { Op } from 'sequelize';

import cache from '../cache';
import models from '../models';
import helpers from '../helpers';

/**
 * @class Controller
 */
export default new class {
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
      const logs = await models.adminAction.findAndCount({
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
}();
