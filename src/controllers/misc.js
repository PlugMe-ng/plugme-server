import { Op } from 'sequelize';
import moment from 'moment';

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
   * Retrieves tags along with the level of interactions with their contents within
   * the specified period
   *
   * @param {object} req - Express Request Object
   * @param {object} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Controller
   */
  tagStats = async (req, res) => {
    const { where: filter } = req.meta.filter;
    const period = filter.period
      ? filter.period.split(',')
      : [moment().subtract(30, 'days').toDate(), moment().toDate()];
    const throughFilter = {
      attributes: [],
      where: { createdAt: { [Op.between]: period } }
    };

    try {
      let tags = await models.tag.findAll({
        attributes: ['id', 'title'],
        include: [{
          model: models.content,
          as: 'contents',
          attributes: ['id'],
          through: { attributes: [] },
          include: [{
            model: models.User,
            as: 'likers',
            attributes: ['id'],
            through: { ...throughFilter }
          }, {
            model: models.User,
            as: 'viewers',
            attributes: ['id'],
            through: { ...throughFilter }
          }, {
            model: models.comment,
            attributes: ['id'],
            required: false,
            where: { createdAt: { [Op.between]: period } }
          }, {
            model: models.User,
            as: 'flaggers',
            attributes: ['id'],
            through: { ...throughFilter }
          }]
        }]
      });
      tags = tags.map((tag) => {
        tag = tag.get({ plain: true });
        tag.totalLikes = 0;
        tag.totalViews = 0;
        tag.totalComments = 0;
        tag.totalFlags = 0;

        tag.contents.forEach((content) => {
          tag.totalLikes += content.likers.length;
          tag.totalViews += content.viewers.length;
          tag.totalComments += content.comments.length;
          tag.totalFlags += content.flaggers.length;
        });
        delete tag.contents;
        return tag;
      });
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();
