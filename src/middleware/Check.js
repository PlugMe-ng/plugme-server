import { Op } from 'sequelize';

/**
 * @fileOverview Check middleware
 *
 * @author Franklin Chieze
 *
 * @requires ../models
 */
import moment from 'moment';
import models from '../models';
import helpers from '../helpers';

const minorTagsOnly = async tags =>
  (await models.tag.findAll({
    where: {
      id: { [Op.in]: tags },
      categoryId: { [Op.eq]: null }
    }
  }))
    .length === 0;

/**
* Middleware for checks
* @class Check
*/
export default class Check {
  /**
  * Confirm that the currently authenticated user is an admin
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async currentUserIsAdmin(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        throw new Error('You do not have permissions to perform this operation.');
      }
      next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
  * Middleware for restricting a user with expired subscription
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async userHasActiveSubscription(req, res, next) {
    const user = req.userObj;
    try {
      const userPlanIsExpired = user.plan.expiresAt &&
        moment(user.plan.expiresAt).isBefore(moment.now());
      if (userPlanIsExpired) {
        throw new Error('Please renew your subscription to perform this action');
      }
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
  * Checks if a user has completed their profile
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async userProfileUpdated(req, res, next) {
    const { user } = req;
    try {
      if (!user.photo || !user.locationId || !user.occupationId) {
        throw new Error('Please update your Bio to complete this action');
      }
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Inlcudes required checks for user profile update
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Objetc
   * @param {Function} next - Express Next Function
   *
   * @returns {void}
   * @memberOf Validations
   */
  userProfileUpdate = async (req, res, next) => {
    const MAX_OCCUPATION_EDIT_COUNT = 6;
    const {
      skills, interests, occupationId, fullName
    } = req.body;
    const { userObj: user } = req;
    try {
      if (skills && !(await minorTagsOnly(skills))) {
        throw new Error('Skills can only contain minor tags');
      }
      if (interests) {
        if (!(await minorTagsOnly(interests))) {
          throw new Error('Interests can only contain minor tags');
        }
        if (user.plan.type === 'basic' && interests.length > 5) {
          throw new Error('Maximum of 5 interest tags allowed for basic plan users');
        }
      }
      if (((occupationId && user.occupationId !== occupationId))
        && user.meta.profileModificationCount > MAX_OCCUPATION_EDIT_COUNT) {
        throw new Error('You can no longer modify your occupation, please contact support');
      }
      if (fullName && user.profileVerified) {
        throw new Error('Cannot modify username after account has been verified');
      }
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Checks if the user plan is in the supportedPlans
   * @param {Array} supportedPlans - List of plans supported for this action -
   * defined in @see {@link helpers.Misc.subscriptionPlans}
   *
   * @returns {Function} - An express middleware to handle the request
   * @memberOf Validations
   */
  userPlanIsSupported = supportedPlans => (req, res, next) => {
    const { user } = req;
    try {
      if (!supportedPlans.map(plan => plan.name).includes(user.plan.type)) {
        throw new Error('Please upgrade your plan to perform this action');
      }
    } catch (error) {
      return res.sendFailure([error.message]);
    }
    return next();
  }
}
