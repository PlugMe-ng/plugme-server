/**
 * @fileOverview Auth middleware
 *
 * @author Franklin Chieze
 *
 * @requires NPM:jsonwebtoken
 * @requires ../config
 * @requires ../models
 */

import jwt from 'jsonwebtoken';

import config from '../config';
import models from '../models';

/**
* Middleware for authentication and authorization
* @class Auth
*/
export default class Auth {
  /**
  * Authenticates user
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {json} json with user token
  */
  async authenticateUser(req, res, next) {
    try {
      let userToken = req.headers.authorization;
      if (!userToken) {
        throw new Error('User is not authenticated.');
      }
      userToken = req.headers.authorization.slice(7);

      const userData = jwt.verify(userToken, config.SECRET);
      const user = await models.User.findOne({
        where: { email: userData.email }
      });

      if (!user) {
        throw new Error('User is not authenticated.');
      }
      if (!user.verified) {
        throw new Error('Account is not verified');
      }
      if (user.blocked) {
        throw new Error('You are not authorized to perform this operation, please contact the admin');
      }

      req.user = user.get();
      req.userObj = user;
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
  * Authenticates user
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {json} json with user token
  */
  async optionalUserAuthentication(req, res, next) {
    let userToken = req.headers.authorization;
    if (!userToken) {
      return next();
    }
    userToken = req.headers.authorization.slice(7);
    let userData;
    try {
      userData = jwt.verify(userToken, config.SECRET);
    } catch (error) {
      return next();
    }
    const user = await models.User.findOne({
      where: { email: userData.email }
    });
    if (!user || !user.verified) {
      return next();
    }
    req.user = user.get();
    req.userObj = user;
    return next();
  }
}
