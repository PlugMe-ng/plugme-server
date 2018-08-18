import { Op } from 'sequelize';

import models from '../models';
import helpers from '../helpers';

/**
 * @class Controller
 */
class Controller {
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
      ...(query && { action: { [Op.iLike]: `%${query}%` } })
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
}

export default new Controller();
