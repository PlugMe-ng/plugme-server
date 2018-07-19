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

import models from '../models';
import { sendVerificationEmail, createJwtToken } from '../helpers/auth';
import helpers from '../helpers';

/**
* Controls endpoints for authentication and authorization
* @class Auth
*/
export default class Auth {
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
      if (user && user.password) {
        const isCorrectPassword =
          await bcrypt.compare(req.body.password, user.password);
        if (isCorrectPassword) {
          return res.sendSuccess({
            user: helpers.Misc.updateUserAttributes(user),
            userToken: createJwtToken(user)
          });
        }

        throw new Error('No user was found with the supplied credentials.');
      }

      throw new Error('No user was found with the supplied credentials.');
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
      const existingUser = await models.User.findOne({
        where: { email: req.body.email }
      });
      if (existingUser) {
        throw new Error('User with the same email already exists.');
      }

      const { role, verified, ...data } = req.body;
      const user = await models.User.create({
        ...data,
        password: await bcrypt.hash(
          req.body.password,
          process.env.NODE_ENV === 'production' ? 10 : 1
        )
      });
      sendVerificationEmail(user.get());
      return res.sendSuccess({
        user: helpers.Misc.updateUserAttributes(user),
        userToken: createJwtToken(user)
      });
    } catch (error) {
      return res.sendFailure([error.message]);
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
      const searchCriteria = type === 'google' ?
        { googleId: payload.googleId } : { facebookId: payload.facebookId };

      return await models.User
        .findOrCreate({
          where: searchCriteria,
          defaults: payload
        }).spread(user =>
          res.sendSuccess({
            user: helpers.Misc.updateUserAttributes(user),
            userToken: createJwtToken(user)
          }));
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
      displayName: response.data.name,
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
      displayName: response.given_name,
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
    const tokenValidityPeriod = 43200000;
    const { token } = req.body;
    try {
      const record = await models.emailVerification
        .findOne({ where: { token }, include: [models.User] });
      if (!record) {
        throw new Error('Verification token does not exist');
      }
      const { createdAt, User: user } = record;
      const tokenExpirationTime =
        new Date(createdAt).getTime() + tokenValidityPeriod;

      if (Date.now() > tokenExpirationTime) {
        record.destroy();
        throw new Error('Token has expired, Please request a new one');
      }
      await user.update({ verified: true });
      record.destroy();
      return res.sendSuccess({
        user: helpers.Misc.updateUserAttributes(user),
        userToken: createJwtToken(user)
      });
    } catch (error) {
      res.sendFailure([error.message]);
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
    const { email } = req.body;
    try {
      const user = await models.User
        .findOne({ where: { email }, include: [models.emailVerification] });
      if (!user) {
        throw new Error('Invalid credentials');
      }
      if (user.verified) {
        throw new Error('Account has been verified already');
      }
      const { emailVerification } = user;
      if (emailVerification) {
        await emailVerification.destroy();
      }
      sendVerificationEmail(user.get());
      res.sendSuccess('Verification mail sent successfully');
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
}
