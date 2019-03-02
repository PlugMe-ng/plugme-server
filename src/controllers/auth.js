/**
 * @fileOverview Auth controller
 *
 * @author Franklin Chieze
 *
 * @requires NPM:bcrypt
 * @requires NPM:jsonwebtoken
 * @requires ../config
 * @requires ../helpers
 * @requires ../models
 */

import axios from 'axios';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import moment from 'moment';

import models from '../models';
import { createJwtToken, sendAuthActionMail, generateUserName } from '../helpers/auth';
import helpers from '../helpers';
import searchIndex from '../search_indexing/users';

const checkTokenValidity = (createdAt) => {
  if (moment().isAfter(moment(createdAt).add(6, 'hours'))) {
    throw new Error('Token has expired, Please request a new one');
  }
};

/**
* Controls endpoints for authentication and authorization
* @class Auth
*/
export default new class {
  /**
   * Sign in a user
   * @param {object} req express request object
   * @param {object} res express response object
   *
   * @returns {object} response object
   */
  signin = async (req, res) => {
    try {
      const user = await models.User.findOne({
        where: { email: req.body.email },
      });
      if (!user || !(await bcrypt.compare(req.body.password, user.password || ''))) {
        throw new Error('Invalid sign-in credentials');
      }
      return user.verified ?
        res.sendSuccess({
          user: helpers.Misc.updateUserAttributes(user),
          userToken: createJwtToken(user)
        }) : res.sendSuccess({
          user: helpers.Misc.updateUserAttributes(user)
        });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
  * Register a new user
  * @param {object} req express request object
  * @param {object} res express response object
  *
  * @returns {object} response object
  */
  signup = async (req, res) => {
    try {
      const {
        role, verified, meta, plan, profileVerified, ...data
      } = req.body;
      const user = await models.User.create({
        ...data,
        password: await bcrypt.hash(
          req.body.password,
          process.env.NODE_ENV === 'production' ? 10 : 1
        )
      });
      sendAuthActionMail(user.get(), 'verify');
      return res.sendSuccess({
        user: helpers.Misc.updateUserAttributes(user),
      });
    } catch (error) {
      return res.sendFailure(['Username or email already exists', error.message]);
    }
  }

  /**
   * Authenticates a user through a social auth provider
   * @param {object} req - express request object
   * @param {object} res - express response object
   *
   * @returns {void}
   * @memberOf Auth
   */
  tokenAuth = async (req, res) => {
    const { type, token } = req.body;
    try {
      const payload = await this.getPayloadForSocialAuth(token, type);
      const searchCriteria = { email: payload.email };

      return await models.User
        .findOrCreate({
          where: searchCriteria,
          defaults: {
            ...payload,
            username: generateUserName(payload.fullName)
          }
        }).spread((user, created) => {
          if (created) searchIndex.sync(user.id);
          return res.sendSuccess({
            user: helpers.Misc.updateUserAttributes(user),
            userToken: createJwtToken(user)
          });
        });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Verifies and retrieves the payload required to complete a social
   * authentication from a provider
   * @param {string} idToken - provider token
   * @param {string} providerType - provider type
   *
   * @returns {void}
   * @memberOf Auth
   */
  getPayloadForSocialAuth = async (idToken, providerType) => {
    let payload;
    switch (providerType) {
      case 'google':
        payload = this.getGoogleAuthPayload(idToken);
        break;
      case 'facebook':
        payload = this.getFbAuthPayload(idToken);
        break;
      default:
        return;
    }
    return payload;
  }

  /**
   * Verifies and retrieves the payload required to complete a facebook social
   * authentication
   * @param {string} accessToken - user's access token
   *
   * @returns {object} payload
   * @memberOf Auth
   */
  getFbAuthPayload = async (accessToken) => {
    const fbProfileUrl = 'https://graph.facebook.com/v3.0/me?fields=id,name,email&access_token=';
    const { FACEBOOK_APP_SECRET: appSecret } = process.env;
    const appSecretProof = crypto.createHmac('sha256', appSecret)
      .update(accessToken).digest('hex');
    const response = await axios
      .get(`${fbProfileUrl}${accessToken}&appsecret_proof=${appSecretProof}`);
    return {
      email: response.data.email,
      facebookId: response.data.id,
      verified: true,
      googleId: undefined,
      fullName: response.data.name
    };
  }

  /**
   * Verifies and retrieves the payload required to complete a google social
   * authentication
   * @param {string} idToken -  idToken
   *
   * @returns {object} payload
   * @memberOf Auth
   */
  getGoogleAuthPayload = async (idToken) => {
    const { GOOGLE_CLIENT_ID } = process.env;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });
    const response = ticket.getPayload();
    return {
      email: response.email,
      verified: response.email_verified,
      googleId: response.sub,
      facebookId: undefined,
      fullName: response.name
    };
  }

  /**
   * Verifies user's email address with token sent to user's mailbox
   * during signup
   * @param {object} req - express request object
   * @param {object} res - express response object
   *
   * @returns {void}
   * @memberOf Auth
   */
  emailVerification = async (req, res) => {
    const { token } = req.body;
    try {
      const record = await models.emailAuthAction
        .findOne({
          where: { token, type: 'verify' },
          include: [{
            model: models.User
          }]
        });
      if (!record) {
        throw new Error('Verification token does not exist or has already been used');
      }
      const { createdAt, User: user } = record;
      record.destroy();
      if (user.verified) {
        throw new Error('Account has already been verified, proceed to sign in');
      }
      checkTokenValidity(createdAt);
      user.update({ verified: true });
      searchIndex.sync(user.id);
      return res.sendSuccess({
        user: helpers.Misc.updateUserAttributes(user),
        userToken: createJwtToken(user)
      });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles email verification request
   * @param {object} req - express request object
   * @param {object} res - express response object
   *
   * @returns {void}
   * @memberOf Auth
   */
  requestEmailVerification = async (req, res) => {
    res.sendSuccess({
      message: 'Success: You will receive an email if the specified address is registered'
    });

    const { email } = req.body;
    const user = await models.User
      .findOne({
        where: { email },
        include: [{
          model: models.emailAuthAction,
          required: false,
          where: { type: 'verify' }
        }]
      });
    if (!user) return;
    const { emailAuthAction } = user;
    if (emailAuthAction) await emailAuthAction.destroy();
    sendAuthActionMail(user.get(), 'verify');
  }

  /**
   * Handles password reset request
   * @param {object} req - express request object
   * @param {object} res - express response object
   *
   * @returns {void}
   * @memberOf Auth
   */
  requestPasswordReset = async (req, res) => {
    res.sendSuccess({
      message: 'Success: You will receive an email if the specified address is registered'
    });
    const { email } = req.body;
    const user = await models.User
      .findOne({
        where: { email },
        include: [{
          model: models.emailAuthAction,
          required: false,
          where: { type: 'reset' }
        }]
      });
    if (!user) return;
    const { emailAuthAction } = user;
    if (emailAuthAction) emailAuthAction.destroy();
    sendAuthActionMail(user.get(), 'reset');
  }

  /**
   * @param {object} req - express request object
   * @param {object} res - express response object
   *
   * @returns {void}
   * @memberOf Auth
   */
  passwordReset = async (req, res) => {
    const { token, password } = req.body;
    try {
      const record = await models.emailAuthAction
        .findOne({
          where: { token, type: 'reset' },
          include: [{
            model: models.User
          }]
        });
      if (!record) throw new Error('Reset token does not exist');
      const { createdAt, User: user } = record;
      record.destroy();
      checkTokenValidity(createdAt);

      await user.update({
        password: await bcrypt.hash(
          password,
          process.env.NODE_ENV === 'production' ? 10 : 1
        ),
        verified: true
      });
      return res.sendSuccess({
        message: 'Password Reset successful'
      }, 200, {
        user: helpers.Misc.updateUserAttributes(user),
        userToken: createJwtToken(user)
      });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
}();
