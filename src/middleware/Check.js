/**
 * @fileOverview Check middleware
 *
 * @author Franklin Chieze
 *
 * @requires ../models
 */
import moment from 'moment';
import models from '../models';

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
        throw new Error('Please update your profile to complete this action');
      }
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}
