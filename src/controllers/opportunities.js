import { Op } from 'sequelize';
import moment from 'moment';

import models from '../models';
import helpers, { events } from '../helpers';
import notifications from './notifications';
import { opportunitiesSearchIndex as searchIndex } from '../search_indexing';

/**
 * @description Checks that the opportunity being created is not a
 * duplicate due to network lag
 *
 * @param {Object} userObj - user
 * @param {Object} req - Express request object
 *
 * @returns {void}
 *
 * @memberOf Controller
 */
const duplicateOpportunityUploadCheck = async (userObj, req) => {
  const lastUploadedOpportunity = (await models.opportunity.findOne({
    attributes: [],
    where: {
      pluggerId: userObj.id,
      title: req.body.title,
      createdAt: { [Op.gt]: moment().subtract(10, 'minutes').toDate() }
    }
  }));
  if (lastUploadedOpportunity) throw new Error('Duplicate opportunity');
};

/**
   * Extracted method to check if a review can be posted by the user
   * @param {object} opportunity - opportunity
   * @param {object} user -  user
   *
   * @returns {void}
   * @memberOf Controller
   */
const createOpportunityReviewsChecks = (opportunity, user) => {
  if (!opportunity) {
    throw new Error('Specified opportunity does not exist');
  }

  if (!opportunity.achiever) {
    throw new Error('This opportunity does not have an achiever yet');
  }

  if (![opportunity.plugger.id, opportunity.achiever.id].includes(user.id)) {
    throw new Error('Only the plugger or achiever of this opportunity can post review for it');
  }

  const reviewersIds = opportunity.reviews.map(review => review.User.id);
  if (reviewersIds.includes(user.id)) {
    throw new Error('You have already left a review for this opportuntiy');
  }
};

/**
 * @desc Checks if the specified user can apply for the specified opportunity
 *
 * @param {Object} opportunity opportunity
 * @param {Object} user user
 * @param {Number} maxEntries
 *
 * @returns {void}
 */
const opportunityApplicationChecks = async (opportunity, user) => {
  if (!opportunity) throw new Error('Opportunity with the specified id does not exist');
  if (opportunity.pluggerId === user.id) {
    throw new Error('You cannot apply for an opportunity you created');
  }
  if (user.hasPendingReview) {
    throw new Error('Kindly submit all outstanding reviews to get plugged to a new opportunity');
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
};

const notifyUnselectedAchievers = async (opportunity, author) => {
  const unselectedAchieversIds = (await opportunity.getPlugEntries({
    attributes: ['id']
  })).map(entry => entry.id).filter(id => id !== opportunity.achieverId);

  notifications.create({
    author,
    event: events.OPPORTUNITY_ACHIEVER_SET_OTHERS,
    recipients: unselectedAchieversIds,
    entity: opportunity,
    includeEmail: true
  });
};

/**
 * Notifies premium and pro plan users of the new opportunity if
 * it matches their skills tags and location
 *
 * @param {any} opportunity
 *
 * @returns {void}
 */
const notifyUsers = async (opportunity) => {
  const recipients = (await models.User.findAll({
    attributes: ['id'],
    where: { 'plan.type': { [Op.ne]: 'basic' } },
    include: [{
      model: models.location,
      attributes: [],
      where: { id: opportunity.locationId }
    }, {
      model: models.tag,
      as: 'skills',
      attributes: [],
      where: { id: opportunity.tags.map(tag => tag.id) }
    }]
  })).map(user => user.id);
  notifications.create({
    author: opportunity.plugger,
    event: events.NEW_OPPORTUNITY,
    recipients,
    entity: opportunity,
    includeEmail: true
  });
};

/**
 * @class Controller
 */
export default new class {
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

      if (userObj.hasPendingReview) {
        throw new Error('Kindly submit all outstanding reviews to publish a new opportunity');
      }
      await duplicateOpportunityUploadCheck(userObj, req);

      opportunity = await models.opportunity.create({ ...req.body, status: 'available' });
      await opportunity.setTags(tags);
      await opportunity.setLocation(locationId);
      await opportunity.setPlugger(userObj);

      opportunity = await models.opportunity.findByPk(opportunity.id, {
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
          through: { attributes: [] }
        }]
      });
      notifyUsers(opportunity);
      searchIndex.sync(opportunity.id);
      return res.sendSuccess(opportunity);
    } catch (error) {
      if (opportunity) opportunity.destroy();
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
    const { query } = req.meta.search;

    const where = {
      ...(filter.budget && { budget: { [Op.lte]: filter.budget } }),
      ...(filter.status && { status: filter.status.toLowerCase() }),
      ...(query && {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { responsibilities: { [Op.iLike]: `%${query}%` } }
        ]
      }),
      ...(filter.createdAt && { createdAt: { [Op.between]: filter.createdAt.split(',') } })
    };

    try {
      const opportunities = await models.opportunity.findAndCountAll({
        distinct: true,
        limit,
        offset,
        where,
        order: [[attribute, order]],
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
          through: { attributes: [] }
        }, {
          model: models.User,
          as: 'plugger',
          attributes: ['id', 'username', 'fullName', 'photo', 'occupationId'],
          ...(filter.plugger && { where: { username: { [Op.iLike]: filter.plugger } } }),
          include: [{
            model: models.occupation,
            attributes: ['id', 'title'],
          }],
        }, {
          model: models.User,
          attributes: ['id', 'username', 'fullName'],
          as: 'achiever',
          ...(filter.achiever && {
            where: { username: { [Op.iLike]: filter.achiever } }
          })
        }, {
          model: models.review
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
      const opportunity = await models.opportunity.findByPk(opportunityId, {
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
        }, {
          model: models.User,
          as: 'achiever',
          attributes: ['id', 'username', 'fullName']
        }, {
          model: models.review,
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
      const opportunity = await models.opportunity.findByPk(opportunityId, {
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
      await opportunityApplicationChecks(opportunity, userObj);

      await opportunity.addPlugEntry(userObj);
      if (opportunity.plugEntries.length + 1 === MAX_ENTRIES) {
        await opportunity.update({ status: 'pending' });
        searchIndex.sync(opportunity.id);
      }
      const { plugEntries, ...data } = opportunity.get({ plain: true });
      return res.sendSuccessAndNotify({
        event: events.OPPORTUNITY_APPLICATION,
        recipients: [opportunity.pluggerId],
        entity: opportunity
      }, {
        message: 'Opportunity plugged successfully'
      }, 200, { ...data });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method getOpportunityPlugs
   * @desc Gets all users that have applied for an opportunity
   *
   * @param {Object} req Express Request Object
   * @param {Object} res Express Response Object
   *
   * @returns {void}
   */
  getOpportunityApplications = async (req, res) => {
    const { opportunityId } = req.params;
    try {
      const opportunity = await models.opportunity.findByPk(opportunityId, {
        attributes: [],
        include: [{
          model: models.User,
          as: 'plugEntries',
          through: { attributes: [] },
          attributes: ['id', 'username', 'fullName'],
          include: [{
            model: models.occupation,
            attributes: ['title']
          }, {
            model: models.content,
            as: 'contents',
            attributes: ['totalViews', 'totalLikes'],
            include: [{
              model: models.comment,
              attributes: ['id']
            }]
          }]
        }]
      });
      if (!opportunity) throw new Error('Specified opportunity does not exist');
      const { plugEntries: users } = opportunity.get({ plain: true });
      users.forEach((user) => {
        user.totalViews = 0;
        user.totalLikes = 0;
        user.totalComments = 0;
        user.contents.forEach((content) => {
          user.totalViews += content.totalViews;
          user.totalLikes += content.totalLikes;
          user.totalComments += content.comments.length;
        });
        delete user.contents;
      });
      return res.sendSuccess(users);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method setOpportunityAchiever
   * @desc Plugs an achiever for an opportunity
   *
   * @param {Object} req Express Request Object
   * @param {Object} res Express Response Object
   *
   * @returns {void}
   */
  setOpportunityAchiever = async (req, res) => {
    const { opportunityId, userId } = req.params;
    const { userObj: plugger } = req;

    try {
      const opportunity = await models.opportunity.findByPk(opportunityId);
      if (!opportunity) {
        throw new Error('Specified opportunity does not exist');
      }
      if (opportunity.pluggerId !== plugger.id) {
        throw new Error('Specified opportunity was uploaded by another user');
      }
      if (opportunity.achieverId) {
        throw new Error('This opportunity already has an achiever');
      }
      if (!(await opportunity.hasPlugEntry(userId))) {
        throw new Error('Specified user did not apply for this opportunity');
      }
      await opportunity.update({
        status: 'pending',
        achieverId: userId
      });
      notifyUnselectedAchievers(opportunity, plugger);
      searchIndex.sync(opportunity.id);
      return res.sendSuccessAndNotify({
        event: events.OPPORTUNITY_ACHIEVER_SET,
        recipients: [userId],
        entity: opportunity,
        includeEmail: true
      }, {
        message: 'Achiever plugged successfully'
      });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method reviewOpportunity
   * @desc Handles posting opportunity reviews
   *
   * @param {Object} req Express Request Object
   * @param {Object} res Express Response Object
   *
   * @returns {void}
   */
  reviewOpportunity = async (req, res) => {
    const { opportunityId } = req.params;
    const { userObj } = req;

    try {
      const opportunity = await models.opportunity.findByPk(opportunityId, {
        include: [{
          model: models.User,
          as: 'plugger',
          attributes: ['id']
        }, {
          model: models.User,
          as: 'achiever',
          attributes: ['id']
        }, {
          model: models.review,
          attributes: ['id'],
          include: [{ model: models.User, attributes: ['id'] }]
        }]
      });

      createOpportunityReviewsChecks(opportunity, userObj);

      const review = await models.review.create(req.body);
      await review.setOpportunity(opportunity.id);
      await review.setUser(userObj.id);

      await userObj.update({ hasPendingReview: false });
      const reviewersIds = [...opportunity.reviews.map(r => r.User.id), userObj.id];

      const userWithPendingReview = [opportunity.plugger, opportunity.achiever]
        .filter(user => !reviewersIds.includes(user.id))[0];

      if (userWithPendingReview) {
        await userWithPendingReview.update({ hasPendingReview: true });
      } else {
        await opportunity.update({ status: 'done' });
      }
      searchIndex.sync(opportunity.id);
      return userObj.id === opportunity.pluggerId ?
        res.sendSuccessAndNotify({
          event: events.OPPORTUNITY_REVIEW,
          entity: opportunity,
          recipients: [opportunity.achieverId]
        }, {
          message: 'Review submitted successfully'
        }) :
        res.sendSuccess({ message: 'Review submitted successfully' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles deleting an opportunity
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Controller
   */
  delete = async (req, res) => {
    try {
      const opportunity = await models.opportunity.findByPk(req.params.opportunityId);
      if (!opportunity) throw new Error('Specified opportunity does not exist');

      opportunity.destroy();

      notifications.create({
        author: req.userObj,
        event: events.OPPORTUNITY_DELETE,
        recipients: [opportunity.pluggerId],
        entity: opportunity
      });
      searchIndex.deleteRecord(opportunity.id);
      return res.sendSuccessAndLog(opportunity, { message: 'Opportuntiy deleted successfully' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();
