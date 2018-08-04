import { Op } from 'sequelize';

import models from '../models';
import helpers from '../helpers';

/**
 * @class Controller
 */
class Controller {
  /**
   * Handles creating a new opportunity
   *
   * @param {Express.Request} req - express request object
   * @param {Express.Response} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  createOpportunity = async (req, res) => {
    let opportunity;
    try {
      const { tags, locationId } = req.body;
      const { userObj } = req;

      opportunity = await models.opportunity.create(req.body);
      await opportunity.setTags(tags);
      await opportunity.setLocation(locationId);
      await opportunity.setPlugger(userObj);

      opportunity = await models.opportunity.findById(opportunity.id, {
        include: [{
          model: models.location,
          attributes: ['id', 'name'],
          include: [{
            model: models.country,
            attributes: ['id', 'name']
          }]
        }, {
          model: models.User,
          attributes: ['id', 'username', 'fullName'],
          as: 'plugger'
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          through: {
            attributes: []
          }
        }]
      });
      await res.sendSuccess(opportunity);
    } catch (error) {
      if (opportunity) {
        await opportunity.destroy();
      }
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method get
   * @desc This method gets an array of users
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  get = async (req, res) => {
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;
    const { where: filter } = req.meta.filter;

    try {
      const opportunities = await models.opportunity.findAndCount({
        distinct: true,
        limit,
        offset,
        order: [[attribute, order]],
        ...(filter.budget && { where: { budget: { [Op.lte]: filter.budget } } }),
        include: [{
          model: models.location,
          // attributes: ['id', 'name'],
          ...(filter.location && {
            where: { name: { [Op.iLike]: filter.location } }
          }),
          include: [{
            model: models.country,
            // attributes: ['id', 'name'],
            ...(filter.country && {
              where: { name: { [Op.iLike]: filter.country } }
            }),
          }]
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          ...(filter.tags && {
            where: {
              title: {
                [Op.iLike]: {
                  [Op.any]: filter.tags.split(',').map(tag => tag.trim())
                }
              }
            }
          }),
          through: {
            attributes: []
          }
        }, {
          model: models.User,
          attributes: ['id', 'username', 'fullName'],
          as: 'plugger',
          ...(filter.plugger && {
            where: { username: filter.plugger.toLowerCase() }
          }),
        }]
      });
      const pagination = helpers.Misc.generatePaginationMeta(
        req,
        opportunities,
        limit,
        offset
      );
      return res.sendSuccess({
        opportunities: opportunities.rows
      }, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method getOpportunityById
   * @desc gets an opportunity with the specified id
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  getOpportunityById = async (req, res) => {
    const { opportunityId } = req.params;
    try {
      const opportunity = await models.opportunity.findById(opportunityId, {
        include: [{
          model: models.User,
          as: 'plugger',
          attributes: ['id', 'username', 'fullName']
        }, {
          model: models.tag,
          attributes: ['id', 'title'],
          as: 'tags',
          through: {
            attributes: []
          }
        }, {
          model: models.location,
          attributes: ['id', 'name'],
          include: [{
            model: models.country,
            attributes: ['id', 'name']
          }]
        }]
      });
      if (!opportunity) {
        throw new Error('Specified opportunity does not exist');
      }
      return res.sendSuccess(opportunity);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}

export default new Controller();
