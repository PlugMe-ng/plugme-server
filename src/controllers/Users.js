/**
 * @fileOverview Users controller
 *
 * @author Franklin Chieze
 *
 * @requires ../helpers
 * @requires ../models
 */

import { Op } from 'sequelize';

import helpers from '../helpers';
import models from '../models';

const contentAssociations = {
  model: models.content,
  attributes: ['id', 'totalViews'],
  as: 'contents',
  include: [{
    model: models.User,
    as: 'likers',
    attributes: ['id'],
    through: {
      attributes: []
    }
  }, {
    model: models.comment,
    attributes: ['id']
  }]
};

const userAssociations = [{
  model: models.User,
  as: 'fans',
  include: [contentAssociations],
  attributes: {
    exclude: ['password'],
  },
  through: {
    attributes: []
  },
}, {
  model: models.tag,
  as: 'interests',
  attributes: ['id', 'title'],
  through: {
    attributes: []
  }
}, {
  model: models.tag,
  as: 'skills',
  attributes: ['id', 'title'],
  through: {
    attributes: []
  }
}, {
  model: models.content,
  as: 'contents',
  include: [{
    model: models.User,
    as: 'likers',
    attributes: ['id'],
    through: {
      attributes: []
    }
  }, {
    model: models.User,
    as: 'viewers',
    attributes: ['id'],
    through: {
      attributes: []
    }
  }, {
    model: models.comment,
    attributes: ['id', 'UserId']
  }, {
    model: models.tag,
    attributes: ['id', 'title'],
    as: 'tags',
    through: {
      attributes: []
    }
  }]
}];

const getUserCummulativeData = (user) => {
  let totalContentLikes = 0;
  let totalContentViews = 0;
  let totalContentComments = 0;
  user.contents.forEach((content) => {
    totalContentLikes += content.likers.length;
    totalContentViews += content.totalViews;
    totalContentComments += content.comments.length;
  });
  delete user.contents;
  user.totalLikes = totalContentLikes;
  user.totalViews = totalContentViews;
  user.totalFeedback = totalContentComments;
};

/**
* Users controller class
* @class Users
*/
export default class Users {
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
      let user = await models.User.findOne({
        where: { username: req.params.username.toLowerCase() },
        attributes: { exclude: ['password'] },
        order: [[{ model: models.content, as: 'contents' }, 'createdAt', 'DESC']],
        include: userAssociations
      });
      if (!user) {
        throw new Error('User not found');
      }
      const userFansOf = await user.getFansOf({
        attributes: { exclude: ['password'] },
        include: [contentAssociations],
        joinTableAttributes: []
      });
      user = user.get({ plain: true });
      user.fansOf = userFansOf.map(element =>
        element.get({ plain: true }));

      user.totalLikes = 0;
      user.totalViews = 0;

      user.contents.forEach((content) => {
        user.totalLikes += content.likers.length;
        user.totalViews += content.totalViews;
      });

      user.fans.forEach(getUserCummulativeData);
      user.fansOf.forEach(getUserCummulativeData);

      return res.sendSuccess(user);
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
      const { attribute, order } = req.meta.sort;
      const { where: filter } = req.meta.filter;

      const where = {
        ...(filter.name && {
          [Op.or]: [
            { username: { [Op.iLike]: `%${filter.name}%` } },
            { fullName: { [Op.iLike]: `%${filter.name}%` } }
          ]
        })
      };

      const users = await models.User.findAndCount({
        where,
        limit,
        offset,
        order: [[attribute, order]],
        attributes: {
          exclude: ['password']
        }
      });
      if (users) {
        const pagination = helpers.Misc.generatePaginationMeta(
          req,
          users,
          limit,
          offset
        );
        return res.sendSuccess(users.rows, 200, { pagination });
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
   * @method adminUserUpdate
   * @desc This method updates the user with the specified user ID
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  adminUserUpdate = async (req, res) => {
    try {
      await models.User.update(req.body, { where: { id: req.params.userId } });
      return res.sendSuccess({ message: 'User updated successfully' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
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
