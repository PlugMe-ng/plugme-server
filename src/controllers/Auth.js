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

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import config from '../config';
import helpers from '../helpers';
import models from '../models';

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
  async signin(req, res) {
    try {
      const user = await models.User.findOne({
        where: { email: req.body.email },
      });
      if (user) {
        const isCorrectPassword =
        await bcrypt.compare(req.body.password, user.password);
        if (isCorrectPassword) {
          const userToken = jwt.sign({ email: user.email }, config.SECRET);
          const updatedUser = helpers.Misc.updateUserAttributes(user);
          return res.sendSuccess({ user: updatedUser, userToken });
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
  async signup(req, res) {
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

      const userToken = jwt.sign({ email: user.email }, config.SECRET);
      const updatedUser = helpers.Misc.updateUserAttributes(user);

      return res.sendSuccess({ user: updatedUser, userToken });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }


  /**
   * @param {Object} req - Express Request Object
   * @param {Object} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Auth
   */
  googleSignIn = async (req, res) => {
    const { GOOGLE_CLIENT_ID } = process.env;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);

    try {
      const ticket = await client.verifyIdToken({
        idToken: req.body.idToken,
        audience: GOOGLE_CLIENT_ID
      });

      // rare
      if (!ticket) {
        throw new Error('Invalid Token or Error Verifying Token');
      }

      const {
        email, name, sub, given_name: givenName
      } = ticket.getPayload();

      return await models.User
        .findOrCreate({
          where: { googleId: sub },
          defaults: {
            displayName: givenName,
            email,
            googleId: sub,
            fullName: name,
          }
        }).spread((user, created) => {
          const userToken = jwt.sign({ email: user.email }, config.SECRET);
          const updatedUser = helpers.Misc.updateUserAttributes(user);

          return res.sendSuccess({ user: updatedUser, userToken });
        });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
}
