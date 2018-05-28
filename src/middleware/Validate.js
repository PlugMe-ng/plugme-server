/**
 * @fileOverview Validate middleware
 *
 * @author Franklin Chieze
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';

const facebookSigninUserRules = {
  facebookId: 'numeric',
};
const facebookSignupUserRules = {
  displayName: 'required|string',
  email: 'required|email',
  facebookId: 'string',
  photo: 'string',
};

const googleSigninUserRules = {
  googleId: 'numeric',
};
const googleSignupUserRules = {
  displayName: 'required|string',
  email: 'required|email',
  googleId: 'numeric',
  photo: 'string',
};

const signinUserRules = {
  email: 'required|email',
  password: 'required|string',
};
const signupUserRules = {
  displayName: 'required|string',
  email: 'required|email',
  password: 'required|string',
  photo: 'string',
};

/**
* Middleware for validations
* @class Validate
*/
export default class Validate {
  /**
  * Validate sign in user data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async signinUser(req, res, next) {
    const validation = new Validator(req.body, signinUserRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('email'),
      ...validation.errors.get('password'),
    ]));
    validation.passes(() => next());
  }

  /**
  * Validate sign up user data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async signupUser(req, res, next) {
    const validation = new Validator(req.body, signupUserRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('displayName'),
      ...validation.errors.get('email'),
      ...validation.errors.get('password'),
      ...validation.errors.get('photo'),
    ]));
    validation.passes(() => next());
  }
}
