import { Op } from 'sequelize';
import isUUID from 'validator/lib/isUUID';

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

      opportunity = await models.opportunity.create({ ...req.body, status: 'available' });
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
        ...((filter.budget || filter.status) &&
          {
            where: {
              ...(filter.budget && { budget: { [Op.lte]: filter.budget } }),
              ...(filter.status && { status: filter.status.toLowerCase() })
            }
          }),
        include: [{
          model: models.location,
          attributes: ['id', 'name', 'countryId'],
          ...((filter.locationId || filter.countryId) && {
            where: {
              ...(filter.locationId && {
                id: filter.locationId
              }),
              ...(filter.countryId && {
                countryId: filter.countryId
              })
            }
          }),
          include: [{
            model: models.country,
            attributes: ['id', 'name'],
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

  /**
   * @method opportunityApplication
   * @desc Handles applying for an opportunity
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  opportunityApplication = async (req, res) => {
    const MAX_ENTRIES = 24;

    const { userObj } = req;
    const { opportunityId } = req.params;
    try {
      const opportunity = await models.opportunity.findById(opportunityId, {
        include: [{
          model: models.User,
          as: 'plugEntries',
          attributes: ['id'],
          through: { attributes: [] }
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          through: { attributes: [] }
        }]
      });
      await this.opportunityApplicationChecks(opportunity, userObj);

      await opportunity.addPlugEntry(userObj);
      if (opportunity.plugEntries.length + 1 === MAX_ENTRIES) {
        await opportunity.update({
          status: 'pending'
        });
      }
      const { plugEntries, ...data } = opportunity.get({ plain: true });
      return res.sendSuccess({
        message: 'Application successful'
      }, 200, { ...data });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method opportunityApplicationChecks
   * @desc Checks if the specified user can apply for the specified opportunity
   *
   * @param {Object} opportunity opportunity
   * @param {Object} user user
   * @param {Number} maxEntries
   *
   * @returns {void}
   */
  opportunityApplicationChecks = async (opportunity, user) => {
    if (!opportunity) {
      throw new Error('Opportunity with the specified id does not exist');
    }
    if (opportunity.pluggerId === user.id) {
      throw new Error('You cannot apply for an opportunity you created');
    }
    if (opportunity.status !== 'available') {
      throw new Error('This opportunity has passed');
    }
    const userSkills = (await user.getSkills({
      joinTableAttributes: []
    })).map(skill => skill.id);
    const opportunityTags = opportunity.tags.map(tag => tag.id);

    let userCanApply = false;
    for (let i = 0; i < userSkills.length; i += 1) {
      const skill = userSkills[i];
      if (opportunityTags.includes(skill)) {
        userCanApply = true;
        break;
      }
    }
    if (!userCanApply) {
      throw new Error('You can only get plugged to opportunities that fit your indicated skill set');
    }
  }
}

export default new Controller();
