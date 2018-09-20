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
  username: 'required|between:5,20|alpha_dash',
  email: 'required|email',
  password: 'required|string|between:7,25',
  photo: 'string',
  fullName: 'required|string|between:5,25'
};
const tokenSignInRules = {
  token: 'required|string',
  type: 'required|in:facebook,google'
};
const emailVerificationRules = {
  token: 'required|string',
};

const requestEmailAuthActionRules = {
  email: 'required|email'
};

const passwordResetRules = {
  token: 'string|required',
  password: 'required|string|between:7,25',
};

/**
* Middleware for validations
* @class Validate
*/
class Validate {
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
      ...validation.errors.get('username'),
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
  * Validates email auth action request data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {void}
  */
  emailAuthAction(req, res, next) {
    const validation = new Validator(req.body, requestEmailAuthActionRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('email')
    ]));
    validation.passes(() => next());
  }

  /**
  * Validates email auth action request data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {void}
  */
  passwordReset(req, res, next) {
    const validation = new Validator(req.body, passwordResetRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('token'),
      ...validation.errors.get('password')
    ]));
    validation.passes(() => next());
  }
}

export default new Validate();
