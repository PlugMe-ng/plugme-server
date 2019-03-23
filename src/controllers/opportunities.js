import { Op } from 'sequelize';
import moment from 'moment';

import models from '../models';
import helpers, { events } from '../helpers';
import notifications from './notifications';
import { opportunitiesSearchIndex as searchIndex } from '../search_indexing';

const { Misc: { isAdmin, subscriptionPlans } } = helpers;

/**
 * @description Checks that the opportunity being created is not a
 * duplicate due to network lag
 *
 * @param {Object} userObj - user
 * @param {Object} reqBody - Express request object
 *
 * @returns {void}
 *
 * @memberOf Controller
 */
const duplicateOpportunityUploadCheck = async (userObj, reqBody) => {
  const lastUploadedOpportunity = (await models.opportunity.findOne({
    attributes: [],
    where: {
      pluggerId: userObj.id,
      title: reqBody.title,
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
  const REQUIRED_USER_CONTENTS_COUNT = 1;
  const errorMessages = {
    OPPORTUNITY_NOT_FOUND: 'Opportunity with the specified id does not exist',
    OPPORTUNITY_PLUGGER_NOT_ALLOWED: 'You cannot apply for an opportunity you created',
    HAS_PENDING_REVIEW: 'Kindly submit all outstanding reviews to get plugged to a new opportunity',
    OPPORTUNITY_NOT_AVAILABLE: 'This opportunity has passed',
    VERIFIED_ACHIEVERS_ONLY: 'Please verify your portfolio to get plugged to this opportunities',
    NOT_MATCHING_ALLOW_PLANS: 'You can only get plugged to this opportunity if ' +
    'you match the Achiever Needed by the Plugger.',
    NOT_MATCHING_SKILLS_OCCUPATION: 'You can only get plugged to this job opportunity if you ' +
    'match the Skills or Position Needed by the Plugger.',
    NO_MATCHING_CONTENTS: 'You can only get plugged to this job opportunity if you have' +
    ' an uploaded content that matches the creative skill needed by the Plugger.',
    NO_MATCHING_LOCATION: 'You can only get plugged to this opportunity if you ' +
      'match the Location indicated by the Plugger',
    MAX_OPP_COUNT_THRESHOLD_SURPASSED: 'You have surpassed your monthly limit, ' +
      'please upgrade your plan to get plugged to more jobs.'
  };

  if (!opportunity) throw new Error(errorMessages.OPPORTUNITY_NOT_FOUND);
  if (opportunity.pluggerId === user.id) {
    throw new Error(errorMessages.OPPORTUNITY_PLUGGER_NOT_ALLOWED);
  }
  if (user.hasPendingReview) throw new Error(errorMessages.HAS_PENDING_REVIEW);
  if (opportunity.status !== 'available') throw new Error(errorMessages.OPPORTUNITY_NOT_AVAILABLE);
  if (opportunity.verifiedAchieversOnly && !user.profileVerified) {
    throw new Error(errorMessages.VERIFIED_ACHIEVERS_ONLY);
  }
  if (!opportunity.allowedplans.includes(user.plan.type)) {
    throw new Error(errorMessages.NOT_MATCHING_ALLOW_PLANS);
  }

  const hasAtLeastOneMatchingTag = (await user.getSkills({
    joinTableAttributes: [],
    where: {
      id: opportunity.tags.map(tag => tag.id)
    }
  })).length > 0;
  if (!hasAtLeastOneMatchingTag && opportunity.occupationId !== user.occupationId) {
    throw new Error(errorMessages.NOT_MATCHING_SKILLS_OCCUPATION);
  }

  // has uploaded contents with tags matching opportunity tags
  const matchingContentsCount = await user.countContents({
    includeIgnoreAttributes: false,
    include: [{
      model: models.tag,
      attributes: [],
      as: 'tags',
      where: {
        id: opportunity.tags.map(tag => tag.id)
      }
    }]
  });
  if (matchingContentsCount < REQUIRED_USER_CONTENTS_COUNT) {
    throw new Error(errorMessages.NO_MATCHING_CONTENTS);
  }

  const userHasMatchingLocation = !!(await models.User.findOne({
    where: {
      id: user.id,
      ...((opportunity.locationId || opportunity.lgaId) && {
        ...(opportunity.lgaId ? { lgaId: opportunity.lgaId }
          : { locationId: opportunity.locationId })
      })
    }
  }, {
    ...(opportunity.countryId && {
      include: [{
        model: models.location,
        where: { countryId: opportunity.countryId }
      }]
    })
  }));
  if (!userHasMatchingLocation) throw new Error(errorMessages.NO_MATCHING_LOCATION);

  if (user.plan.type === subscriptionPlans.PROFESSIONAL.name) {
    const MONTHLY_OPP_APP_COUNT_THRESHOLD = 10;
    const countMonthToDateAppliedOpp = await user.countAppliedOpportunities({
      through: {
        where: {
          createdAt: { [Op.between]: [moment().startOf('month').toDate(), moment().toDate()] }
        }
      }
    });
    if (countMonthToDateAppliedOpp >= MONTHLY_OPP_APP_COUNT_THRESHOLD) {
      throw new Error(errorMessages.MAX_OPP_COUNT_THRESHOLD_SURPASSED);
    }
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
    where: {
      'plan.type': { [Op.in]: opportunity.allowedplans },
      ...(opportunity.verifiedAchieversOnly && { profileVerified: true }),
      ...((opportunity.locationId || opportunity.lgaId) && {
        ...(opportunity.lgaId ? {
          lgaId: opportunity.lgaId
        } : {
          locationId: opportunity.locationId
        })
      })
    },
    include: [...(opportunity.countryId ? [{
      model: models.location,
      where: { countryId: opportunity.countryId }
    }] : []), {
      model: models.tag,
      as: 'skills',
      attributes: ['id'],
      where: { id: opportunity.tags.map(tag => tag.id) },
      required: false
    }, {
      model: models.occupation,
      attributes: ['id'],
      required: false,
      where: { id: opportunity.occupationId }
    }, {
      model: models.content,
      attributes: ['id'],
      as: 'contents',
      required: true,
      include: [{
        model: models.tag,
        as: 'tags',
        attributes: ['id'],
        through: { attributes: [] },
        where: { id: opportunity.tags.map(tag => tag.id) }
      }]
    }]
  }))
    // sequelize should be able to do this directly, but using filter for now
    .filter(user => user.skills.length || user.occupation)
    .map(user => user.id);
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
      const { tags, ...reqBody } = req.body;
      const { userObj } = req;

      if (userObj.hasPendingReview) {
        throw new Error('Kindly submit all outstanding reviews to publish a new opportunity');
      }
      if (!reqBody.lgaId && !reqBody.locationId && !reqBody.countryId) {
        throw new Error('Please specify a location for this opportunity');
      }
      if (reqBody.lgaId) {
        delete reqBody.locationId;
        delete reqBody.countryId;
      }
      if (reqBody.locationId) delete reqBody.countryId;
      await duplicateOpportunityUploadCheck(userObj, reqBody);

      opportunity = await models.opportunity.create({
        ...reqBody,
        status: 'available',
        pluggerId: userObj.id
      });
      await opportunity.setTags(tags);

      opportunity = await models.opportunity.findByPk(opportunity.id, {
        include: [{
          model: models.location,
          attributes: ['id', 'name'],
          include: [{
            model: models.country,
            attributes: ['id', 'name']
          }]
        }, {
          model: models.localgovernment,
          attributes: ['id', 'name']
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
      return res.sendSuccess(opportunity);
    } catch (error) {
      if (opportunity) opportunity.destroy();
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method get
   * @desc This method gets an array of users.
   * Locations eager load is shitty, I know. Ask the client.
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
          model: models.localgovernment,
          attributes: ['id', 'name'],
          ...(filter.localgovernment && {
            where: { id: filter.localgovernment }
          }),
          include: [{
            model: models.location,
            attributes: ['id', 'name'],
            include: [{
              model: models.country,
              attributes: ['id', 'name'],
            }]
          }]
        }, {
          model: models.location,
          attributes: ['id', 'name'],
          ...(filter.location && {
            where: { id: filter.location }
          }),
          include: [{
            model: models.country,
            attributes: ['id', 'name'],
          }]
        }, {
          model: models.country,
          attributes: ['id', 'name'],
          ...(filter.country && {
            where: { id: filter.country }
          }),
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
          model: models.review,
          attributes: ['rating']
        }, ...isAdmin(req.user) ? [{
          model: models.User,
          attributes: ['id', 'username', 'fullName'],
          as: 'achiever',
          ...(filter.achiever && {
            where: { username: { [Op.iLike]: filter.achiever } }
          })
        }, {
          model: models.User,
          as: 'plugEntries',
          attributes: ['id'],
          through: { attributes: [] }
        }] : []
        ]
      });
      // TODO: sequelize should be able to do this directly, but there are issues achieveing it
      if (isAdmin(req.user)) {
        opportunities.rows = opportunities.rows.map((opportunity) => {
          opportunity = opportunity.get();
          opportunity.totalPlugEntries = opportunity.plugEntries.length;
          delete opportunity.plugEntries;
          return opportunity;
        });
      }
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
          through: { attributes: [] }
        }, {
          model: models.localgovernment,
          attributes: ['id', 'name'],
          include: [{
            model: models.location,
            attributes: ['id', 'name'],
            include: [{
              model: models.country,
              attributes: ['id', 'name'],
            }]
          }]
        }, {
          model: models.location,
          attributes: ['id', 'name'],
          include: [{
            model: models.country,
            attributes: ['id', 'name']
          }]
        }, {
          model: models.country,
          attributes: ['id', 'name'],
        }, {
          model: models.occupation,
          as: 'positionNeeded',
          attributes: ['id', 'title']
        }, {
          model: models.User,
          as: 'achiever',
          attributes: ['id', 'username', 'fullName']
        }, {
          model: models.review,
        }]
      });
      if (!opportunity) throw new Error('Specified opportunity does not exist');
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
    const MAX_ENTRIES = 40;

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
      }
      const { plugEntries, ...data } = opportunity.get({ plain: true });
      return res.sendSuccessAndNotify({
        event: events.OPPORTUNITY_APPLICATION,
        recipients: [opportunity.pluggerId],
        entity: opportunity,
        includeEmail: true
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
          attributes: ['id', 'username', 'fullName', 'photo'],
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
        searchIndex.sync(opportunity.id);
      }
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
