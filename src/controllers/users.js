import axios from 'axios';
import moment from 'moment';
import { Op } from 'sequelize';

import helpers, { events } from '../helpers';
import models from '../models';
import config from '../config';

/**
* Users controller class
* @class Users
*/
export default new class {
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
        where: { username: req.params.username },
        attributes: { exclude: ['password', 'occupationId', 'locationId'] },
        include: [{
          model: models.content,
          as: 'contents',
          attributes: ['totalLikes', 'totalViews'],
        }, {
          model: models.tag,
          as: 'interests',
          attributes: ['id', 'title'],
          through: { attributes: [] }
        }, {
          model: models.tag,
          as: 'skills',
          attributes: ['id', 'title'],
          through: { attributes: [] }
        }, {
          model: models.location,
          attributes: ['id', 'name'],
          include: [{
            model: models.country,
            attributes: ['id', 'name']
          }]
        }, {
          model: models.occupation,
          attributes: ['id', 'title']
        }]
      });
      if (!user) {
        throw new Error('User not found');
      }

      const totalFansOf = await user.countFansOf();
      const totalFans = await user.countFans();

      user = user.get({ plain: true });
      user.totalFans = totalFans;
      user.totalFansOf = totalFansOf;

      user.totalLikes = 0;
      user.totalViews = 0;

      user.contents.forEach((content) => {
        user.totalLikes += content.totalLikes;
        user.totalViews += content.totalViews;
      });
      delete user.contents;

      return res.sendSuccess(user);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method getUserGallery
   * @desc Retrieves a user gallery contents
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns {void}
   */
  getUserGallery = async (req, res) => {
    const user = req.userObj;
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;

    try {
      // const userInterestTags = (await user.getInterests({
      //   joinTableAttributes: [],
      //   attributes: ['id']
      // })).map(tag => tag.id);

      const count = await user.countGalleryContents();
      const contents = await user.getGalleryContents({
        limit,
        offset,
        attributes: { exclude: ['flagCount'] },
        order: [[attribute, order]],
        joinTableAttributes: [],
        include: [{
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          // where: { id: userInterestTags },
          through: { attributes: [] }
        }, {
          model: models.User,
          as: 'author',
          attributes: ['id', 'username', 'fullName']
        }, {
          model: models.comment,
          attributes: ['UserId']
        }, {
          model: models.User,
          as: 'likers',
          attributes: ['id'],
          through: { attributes: [] }
        }, {
          model: models.User,
          as: 'viewers',
          attributes: ['id'],
          through: { attributes: [] }
        }]
      });
      const pagination = helpers.Misc.generatePaginationMeta(req, { count }, limit, offset);
      return res.sendSuccess(contents, 200, { pagination });
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
        }),
        ...(filter.role && { role: filter.role.toLowerCase() }),
        ...(filter.lastSeen && { lastSeen: { [Op.between]: filter.lastSeen.split(',') } })
      };

      const users = await models.User.findAndCount({
        distinct: true,
        where,
        limit,
        offset,
        order: [[attribute, order]],
        attributes: {
          exclude: ['password']
        },
        include: [{
          model: models.tag,
          as: 'skills',
          attributes: [],
          through: { attributes: [] },
          where: {
            ...(filter.skills && {
              where: {
                title: {
                  [Op.iLike]: {
                    [Op.any]: filter.skills.split(',').map(tag => tag.trim())
                  }
                }
              }
            }),
          }
        }, {
          model: models.occupation,
          attributes: [],
          where: {
            ...(filter.occupations && {
              where: {
                title: {
                  [Op.iLike]: {
                    [Op.any]: filter.occupations.split(',').map(tag => tag.trim())
                  }
                }
              }
            }),
          }
        }]
      });

      const pagination = helpers.Misc.generatePaginationMeta(req, users, limit, offset);
      return res.sendSuccess(users.rows, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @desc Retrieves all the fans of the specified user
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  getUserFans = async (req, res) => {
    const { limit, offset } = req.meta.pagination;
    try {
      const user = await models.User
        .findOne({ where: { username: req.params.username }, attributes: ['id'] });
      if (!user) {
        throw new Error('Specified user does not exist');
      }
      const count = await user.countFans();
      const fans = await user.getFans({
        limit,
        offset,
        where: {
          ...(req.query.id && { id: req.query.id })
        },
        group: ['User.id'],
        attributes: [
          'id',
          'username',
          'fullName',
          'photo',
          [models.sequelize.fn('sum', models.sequelize.col('contents.totalLikes')), 'totalLikes'],
          [models.sequelize.fn('sum', models.sequelize.col('contents.totalViews')), 'totalViews'],
          [models.sequelize.fn('count', models.sequelize.col('contents.id')), 'totalComments']
        ],
        joinTableAttributes: [],
        include: [{
          duplicating: false,
          model: models.content,
          as: 'contents',
          attributes: [],
          include: [{
            model: models.comment,
            attributes: [],
            duplicating: false,
          }]
        }]
      });
      const pagination = helpers.Misc.generatePaginationMeta(
        req,
        { count },
        limit,
        offset
      );
      return res.sendSuccess(fans, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @desc Retrieves all users the specified user is following
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  getUserFansOf = async (req, res) => {
    const { limit, offset } = req.meta.pagination;
    try {
      const user = await models.User
        .findOne({ where: { username: req.params.username }, attributes: ['id'] });
      if (!user) {
        throw new Error('Specified user does not exist');
      }
      const count = await user.countFansOf();
      const fans = await user.getFansOf({
        limit,
        offset,
        group: ['User.id'],
        attributes: [
          'id',
          'username',
          'fullName',
          'photo',
          [models.sequelize.fn('sum', models.sequelize.col('contents.totalLikes')), 'totalLikes'],
          [models.sequelize.fn('sum', models.sequelize.col('contents.totalViews')), 'totalViews'],
          [models.sequelize.fn('count', models.sequelize.col('contents.id')), 'totalComments']
        ],
        joinTableAttributes: [],
        include: [{
          duplicating: false,
          model: models.content,
          as: 'contents',
          attributes: [],
          include: [{
            model: models.comment,
            attributes: [],
            duplicating: false,
          }]
        }]
      });
      const pagination = helpers.Misc.generatePaginationMeta(
        req,
        { count },
        limit,
        offset
      );
      return res.sendSuccess(fans, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method update
   * @desc updates the signedIn user profile
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  update = async (req, res) => {
    const { userObj: user } = req;
    const {
      role, email, hasPendingReview, skills, plan, interests, bio, experience, ...data
    } = req.body;
    try {
      if (interests) {
        await user.setInterests(interests);
      }
      if (skills) {
        await user.setSkills(skills);
      }
      await user.update({
        ...data,
        meta: {
          ...user.meta,
          ...(bio && { bio }),
          ...(experience && { experience }),
          ...(req.body.occupationId &&
            { occupationModificationCount: user.meta.occupationModificationCount + 1 })
        }
      });
      return res.sendSuccess({ message: 'Profile updated successfully' }, 200, { user });
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
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
      const user = await models.User.findById(req.params.userId);
      if (!user) throw new Error('Specified user does not exist');
      if (config.SUPER_ADMINS.includes(user.email)) {
        throw new Error('You are not permitted to perform this operation');
      }
      await user.update(req.body);
      return res.sendSuccessAndLog(user, { message: 'User updated successfully' });
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
      return res.sendSuccessAndNotify({
        event: events.NEW_FAN,
        recipients: [user.id],
        entity: user
      }, {
        message: 'You are now a fan of the user'
      });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }

  /**
   * @desc Handles user plan subscription
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  subscription = async (req, res) => {
    const { reference: trxRef } = req.body;
    if (!trxRef) {
      throw new Error('transaction reference token is required');
    }
    try {
      const response = await axios.get(`${config.PAYMENT_VERIFICATION_URL}/${trxRef}`, {
        headers: { Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}` }
      });
      const { status, amount, customer: { email } } = response.data.data;
      if (status !== 'success') {
        throw new Error('Could not verify payment');
      }
      const { type, validity } = helpers.Misc.subscriptionPlans[Number(amount / 100)];

      await models.User.update({
        plan: {
          type,
          expiresAt: moment().add(...validity).valueOf()
        },
      }, { where: { email } });
      return res.sendSuccess({ message: 'User plan updated successfully' });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();