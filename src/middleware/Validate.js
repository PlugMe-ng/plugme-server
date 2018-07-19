/**
 * @fileOverview Validate middleware
 *
 * @author Franklin Chieze
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';

const signinUserRules = {
  email: 'required|email',
  password: 'required|string',
};
const signupUserRules = {
  displayName: 'required|string|between:4,16',
  email: 'required|email',
  password: 'required|string|between:7,25',
  photo: 'string',
  fullName: 'required|string|between:2,30'
};
const tokenSignInRules = {
  token: 'required|string',
  type: 'required|in:facebook,google'
};
const emailVerificationRules = {
  token: 'required|string',
};

const requestEmailVerificationRules = {
  email: 'required|email'
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
      ...validation.errors.get('fullName')
    ]));
    validation.passes(() => next());
  }

  /**
  * Validate sign up user data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {void}
  */
  tokenSignIn(req, res, next) {
    const validation = new Validator(req.body, tokenSignInRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('token'),
      ...validation.errors.get('type')
    ]));
    validation.passes(() => next());
  }

  /**
  * Validates email verification data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {void}
  */
  emailVerification(req, res, next) {
    const validation = new Validator(req.body, emailVerificationRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('token')
    ]));
    validation.passes(() => next());
  }

  /**
  * Validates email verification request data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {void}
  */
  requestEmailVerification(req, res, next) {
    const validation = new Validator(req.body, requestEmailVerificationRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('email')
    ]));
    validation.passes(() => next());
  }
}
