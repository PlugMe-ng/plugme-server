/**
 * @fileOverview Users controller
 *
 * @author Franklin Chieze
 *
 * @requires ../helpers
 * @requires ../models
 */

import helpers from '../helpers';
import models from '../models';

const { Op } = models.Sequelize;
/**
* Users controller class
* @class Users
*/
export default class Users {
  /**
   * @method deleteById
   * @desc This method deletes the user with the specified user ID
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  async deleteById(req, res) {
    return res.status(200).send({
      data: { name: 'user1' }
    });
  }

  /**
   * @method getByUserName
   * @desc This method get the user with the specified username
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  async getByUsername(req, res) {
    try {
      const user = await models.User.findOne({
        where: { username: req.params.username.toLowerCase() },
        attributes: { exclude: ['password'] },
        include: [{
          model: models.User,
          as: 'fans',
          attributes: {
            exclude: ['password'],
          },
          through: {
            attributes: []
          },
        }, {
          model: models.User,
          as: 'fansOf',
          attributes: {
            exclude: ['password'],
          },
          through: {
            attributes: []
          }
        }, {
          model: models.content,
          as: 'contents',
          include: [{
            model: models.User,
            as: 'likers',
            attributes: ['username', 'id', 'fullName'],
            through: {
              attributes: []
            }
          }, {
            model: models.comment
          }]
        }]
      });
      if (!user) {
        throw new Error('User not found');
      }
      return res.sendSuccess({
        ...user.get()
      });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method get
   * @desc This method gets an array of users
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  async get(req, res) {
    try {
      const { limit, offset } = req.meta.pagination;
      const { query } = req.meta.search;
      const { attribute, order } = req.meta.sort;
      let { where } = req.meta.filter;

      // if search query is present, overwrite the 'where' so that
      // the 'displayName', 'email', and 'githubUsername'
      // are checked to see if they contain
      // that search query (case-INsensitive)
      if (query) {
        where = {
          [Op.or]: [
            { displayName: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
            { githubUsername: { [Op.iLike]: `%${query}%` } }
          ]
        };
      }

      const dbResult = await models.User.findAndCountAll({ where });
      const users = await models.User.findAll({
        where,
        limit,
        offset,
        order: [[attribute, order]]
      });
      if (users) {
        const pagination = helpers.Misc.generatePaginationMeta(
          req,
          dbResult,
          limit,
          offset
        );
        return res.sendSuccess({ users }, 200, { pagination });
      }

      throw new Error('Could not retrieve users from the database.');
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method updateById
   * @desc This method updates the user with the specified user ID
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  async updateById(req, res) {
    // it should be possible to also update the user's role here, right?
    return res.status(200).send({
      data: { name: 'user1' }
    });
  }

  /**
   * @method addFan
   * @desc This method adds a user to the fans of the specified username
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  addFan = async (req, res) => {
    const { username } = req.params;
    try {
      const user = await models.User.findOne({
        where: { username }
      });
      if (!user) {
        throw new Error('No user found with the specified username');
      }
      if (!user.verified) {
        throw new Error('Specified user has not verified their account');
      }
      const { userObj: currentUser } = req;
      if (await user.hasFan(currentUser)) {
        await user.removeFan(currentUser);
        res.sendSuccess({
          message: 'You are no longer a fan of this user'
        });
        return;
      }
      await user.addFan(req.userObj);
      res.sendSuccess({
        message: 'You are now a fan of the user'
      });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
}
