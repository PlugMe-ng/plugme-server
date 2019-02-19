import moment from 'moment';
import { Op } from 'sequelize';
import isUUID from 'validator/lib/isUUID';

import helpers, { events } from '../helpers';
import models from '../models';
import config from '../config';
import { usersSearchIndex } from '../search_indexing';


const getUserMetaUpdate = (user, reqBody) => {
  const {
    bio, experience, expertise, bookingInfo, contentDescription, occupationId
  } = reqBody;
  return {
    ...user.meta,
    ...(bio && { bio }),
    ...(expertise && { expertise }),
    ...(experience && { experience }),
    ...(bookingInfo && { bookingInfo }),
    ...(contentDescription && { contentDescription }),
    ...(((occupationId && user.occupationId !== occupationId)) &&
      { profileModificationCount: user.meta.profileModificationCount + 1 || 1 })
  };
};

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
  async getByUsernameOrId(req, res) {
    const identifier = req.params.usernameOrId;
    try {
      let user = await models.User.findOne({
        where: { [isUUID(identifier, 4) ? 'id' : 'username']: identifier },
        attributes: { exclude: ['password', 'occupationId', 'locationId'] },
        include: [{
          model: models.content,
          as: 'contents',
          attributes: ['totalLikes', 'totalViews'],
          include: [{
            model: models.comment,
            attributes: ['id']
          }]
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
        }, {
          model: models.opportunity,
          as: 'achievements',
          required: false,
          attributes: ['id'],
          where: {
            status: 'done'
          },
          include: [{
            model: models.review,
            attributes: ['rating'],
            include: [{
              model: models.User,
              attributes: [],
              where: {
                [isUUID(identifier, 4) ? ['id'] : 'username']: { [Op.ne]: identifier }
              }
            }]
          }]
        }, {
          model: models.localgovernment,
          attributes: ['id', 'name']
        }]
      });
      if (!user) throw new Error('User not found');

      const totalFansOf = await user.countFansOf();
      const totalFans = await user.countFans();

      user = user.get({ plain: true });
      user.totalFans = totalFans;
      user.totalFansOf = totalFansOf;

      user.totalLikes = 0;
      user.totalViews = 0;
      user.totalComments = 0;
      user.totalContents = user.contents.length;
      user.totalAchievements = user.achievements.length;
      user.averageRating = +(user.achievements
        .reduce((acc, opportunity) => acc + opportunity.reviews[0].rating, 0)
        / (user.totalAchievements || 1)).toFixed(2);

      user.contents.forEach((content) => {
        user.totalLikes += content.totalLikes;
        user.totalViews += content.totalViews;
        user.totalComments += content.comments.length;
      });
      delete user.contents;
      delete user.achievements;

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
      const { user } = req;
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
        ...(filter.lastSeen && { lastSeen: { [Op.between]: filter.lastSeen.split(',') } }),
        ...(filter.plan && {
          plan: {
            type: filter.plan,
            expiresAt: {
              [Op.or]: [
                { [Op.gt]: moment.now().toString() },
                { [Op.eq]: null },
              ]
            }
          }
        })
      };

      const users = await models.User.findAndCountAll({
        distinct: true,
        where,
        limit,
        offset,
        order: [[attribute, order]],
        attributes: {
          exclude: ['password', ...(!user || !helpers.Misc.isAdmin(user)) ? ['email'] : []]
        },
        include: [...(filter.skills ? [{
          model: models.tag,
          as: 'skills',
          attributes: [],
          through: { attributes: [] },
          where: {
            title: {
              [Op.iLike]: {
                [Op.any]: filter.skills.split(',').map(tag => tag.trim())
              }
            }
          }
        }] : []), ...(filter.occupations ? [{
          model: models.occupation,
          attributes: [],
          where: {
            title: {
              [Op.iLike]: {
                [Op.any]: filter.occupations.split(',').map(tag => tag.trim())
              }
            }
          }
        }] : [])]
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
      role, email, hasPendingReview, skills, plan, interests, ...data
    } = req.body;
    try {
      if (interests) await user.setInterests(interests);
      if (skills) await user.setSkills(skills);
      if (data.photo && user.photo) helpers.Misc.deleteImagesFromCloud([user.photo]);
      await user.update({
        ...data,
        meta: getUserMetaUpdate(user, req.body)
      });
      usersSearchIndex.sync(user.id);
      return res.sendSuccess({
        message: 'Profile updated successfully'
      }, 200, {
        user: helpers.Misc.updateUserAttributes(user)
      });
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
      const user = await models.User.findByPk(req.params.userId);
      if (!user) throw new Error('Specified user does not exist');
      if (config.SUPER_ADMINS.includes(user.email) && req.user.email !== user.email) {
        throw new Error('You are not permitted to perform this operation');
      }
      await user.update({
        ...req.body,
        ...(req.body.profileModificationCount && {
          meta: {
            ...user.meta,
            profileModificationCount: Number(req.body.profileModificationCount)
          }
        })
      });
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
        entity: user,
        includeEmail: true
      }, {
        message: 'You are now a fan of the user'
      });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }

  /**
   * @deprecated
   * @desc Handles user plan subscription
   * Only here for backwards compatibility
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  subscription = async (req, res) =>
    res.sendSuccess({ message: 'User plan updated successfully' })

  /**
   * @desc Handles retrieving user's conversations
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  getConversations = async (req, res) => {
    const { userObj: user } = req;
    const { limit, offset } = req.meta.pagination;
    const { query } = req.meta.search;

    const participantsAssociation = {
      model: models.User,
      as: 'participants',
      attributes: [],
      through: { attributes: [] },
      where: {
        id: { [Op.ne]: user.id },
        ...(query && {
          [Op.or]: [
            { username: { [Op.iLike]: `%${query}%` } },
            { fullName: { [Op.iLike]: `%${query}%` } }
          ]
        })
      }
    };

    const count = await user.countConversations({
      includeIgnoreAttributes: false,
      include: [{ ...participantsAssociation }]
    });
    const conversations = await user.getConversations({
      limit,
      offset,
      order: [[models.sequelize.literal('"users_conversations"."updatedAt"'), 'DESC']],
      joinTableAttributes: ['read'],
      include: [{
        model: models.message,
        separate: true,
        limit: 1,
        order: [['createdAt', 'DESC']]
      }, {
        ...participantsAssociation,
        duplicating: false,
        attributes: ['id', 'username', 'fullName', 'photo'],
      }]
    });
    const pagination = helpers.Misc.generatePaginationMeta(req, { count });
    return res.sendSuccess(conversations, 200, { pagination });
  }

  /**
   * @param { object } req request
   * @param { object } res response
   *
   * @returns { object } response
   */
  getUnreadConversationsCount = async (req, res) => {
    const { user } = req;
    const count = await models.user_conversation.count({
      where: { read: false, participantId: user.id }
    });
    return res.sendSuccess(count);
  }
}();
