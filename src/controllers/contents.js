import moment from 'moment';
import { Op } from 'sequelize';
import _ from 'underscore';

import models from '../models';
import helpers, { events } from '../helpers';
import notifications from './notifications';

const { isAdmin } = helpers.Misc;

const addViewEntry = async (user, content) => {
  if (!user) {
    return;
  }
  const viewer = (await content.getViewers({ where: { id: user.id } }))[0];

  if (!viewer) {
    content.addViewer(user);
    content.increment('totalViews');
    return;
  }
  const view = viewer.contents_users_views;
  const midnight = new Date().setHours(0, 0, 0);
  const lastViewTime = new Date(view.createdAt).getTime();

  if (lastViewTime > midnight) {
    return;
  }
  await view.destroy();
  content.addViewer(user);
  content.increment('totalViews');
};

const notifyFans = async (user, content) => {
  const fans = (await user.getFans({ attributes: ['id'] })).map(fan => fan.id);
  notifications.create({
    author: user, event: events.NEW_CONTENT, recipients: fans, entity: content
  });
};

/**
 * Starts the free basic plan expiration countdown of a user after the first content upload
 *
 * @param {object} user
 *
 * @returns {void}
 */
const updateUserPlan = (user) => {
  if (!user.plan.expiresAt) {
    user.update({ 'plan.expiresAt': moment().add(3, 'months').valueOf() });
  }
};

const populateUsersGalleries = async (content) => {
  let interestedUsers = (await content.getTags({
    attributes: [],
    joinTableAttributes: [],
    include: [{
      model: models.User,
      as: 'interestedUsers',
      attributes: ['id'],
      through: { attributes: [] }
    }]
  })).map(tag => tag.interestedUsers.map(user => user.id))
    .reduce((a, b) => [...a, ...b], []);
  interestedUsers = _.shuffle(interestedUsers);

  switch (content.author.plan.type) {
    case 'basic': {
      const reach = Math.ceil(interestedUsers.length / 2);
      const users = interestedUsers.slice(0, reach);
      content.setUsers(users);
      break;
    }
    case 'pro': {
      const reach = Math.ceil(interestedUsers.length * (3 / 4));
      const users = interestedUsers.slice(0, reach);
      content.setUsers(users);
      break;
    }
    case 'premium': {
      content.setUsers(interestedUsers);
      break;
    }
    default:
      break;
  }
};

/**
 * @class ContentsController
 */
export default new class {
  /**
   * Creates a new content
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  createContent = async (req, res) => {
    let content;
    try {
      const { userObj } = req;
      content = await models.content.create({
        ...req.body, totalViews: 0, totalLikes: 0
      });
      await content.setAuthor(userObj);
      await content.setTags(req.body.tags);
      content = await models.content.findById(content.id, {
        include: [{
          model: models.User,
          as: 'author',
          attributes: ['fullName', 'username', 'plan']
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['title'],
          through: {
            attributes: []
          }
        }]
      });
      notifyFans(userObj, content);
      populateUsersGalleries(content);
      updateUserPlan(userObj);
      return res.sendSuccess({ ...content.get() });
    } catch (error) {
      if (content) {
        content.destroy();
      }
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Gets all contents
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  get = async (req, res) => {
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;
    const { where: filter } = req.meta.filter;

    const { userObj } = req;

    const where = {
      ...(isAdmin(userObj) &&
      filter.flagCount && { flagCount: { [Op.gte]: filter.flagCount } })
    };

    try {
      const contents = await models.content.findAndCountAll({
        distinct: true,
        limit,
        offset,
        where,
        attributes: { exclude: [!isAdmin(userObj) && 'flagCount'] },
        order: [[attribute, order]],
        include: [{
          model: models.comment,
          attributes: ['id', 'UserId']
        }, {
          model: models.User,
          as: 'author',
          attributes: ['fullName', 'username', 'id'],
          ...(filter.author && {
            where: { username: { [Op.iLike]: filter.author } }
          })
        }, {
          model: models.User,
          as: 'likers',
          attributes: ['id'],
          ...(filter.like_days && { required: true }),
          through: {
            attributes: [],
            where: {
              ...(filter.like_days && {
                createdAt: {
                  [Op.gt]: helpers.Misc.getTimeFromNow(filter.like_days)
                }
              })
            }
          }
        }, {
          model: models.User,
          as: 'viewers',
          attributes: ['id'],
          through: {
            attributes: []
          }
        }, ...(isAdmin(userObj) && filter.flagCount ?
          [{
            model: models.User,
            as: 'flaggers',
            attributes: ['id', 'username', 'fullName'],
            through: {
              attributes: ['info']
            }
          }] : []), {
          model: models.tag,
          attributes: ['id', 'title'],
          as: 'tags',
          through: {
            attributes: []
          },
          ...(filter.tags && {
            where: {
              title: {
                [Op.iLike]: {
                  [Op.any]: filter.tags.split(',').map(tag => tag.trim())
                }
              }
            }
          }),
        }]
      });
      const pagination = helpers.Misc.generatePaginationMeta(
        req,
        contents,
        limit,
        offset
      );
      return res.sendSuccess({ contents: contents.rows }, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Gets a single content
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  getContent = async (req, res) => {
    const { contentId } = req.params;
    const { userObj } = req;
    try {
      const content = await models.content.findById(contentId, {
        include: [{
          model: models.User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'photo']
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          through: { attributes: [] }
        }, {
          model: models.User,
          as: 'likers',
          attributes: ['id'],
          through: {
            attributes: []
          }
        }]
      });
      if (!content) {
        throw new Error('Specified content does not exist');
      }
      addViewEntry(userObj, content);
      return res.sendSuccess(content);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles content liking action
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  likeContent = async (req, res) => {
    try {
      const { userObj, content } = req;
      if (await content.hasLiker(userObj)) {
        await content.removeLiker(userObj);
        await content.decrement('totalLikes');
        return res.sendSuccess({
          message: 'You have successfully unliked this content'
        });
      }
      await content.addLiker(userObj);
      await content.increment('totalLikes');
      return res.sendSuccessAndNotify({
        event: events.LIKE,
        recipients: [content.authorId],
        entity: content
      }, {
        message: 'You have successfully liked this content'
      });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles content flagging action
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  flagContent = async (req, res) => {
    const { content, userObj } = req;
    try {
      if (!(await content.hasFlagger(userObj))) {
        content.increment('flagCount');
      }
      await content.addFlagger(userObj, {
        through: {
          info: req.body.info
        }
      });
      return res.sendSuccess({
        message: 'Content has been successfully reported'
      });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles content deletion action
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  deleteContent = async (req, res) => {
    const { content, user } = req;
    try {
      if (content.authorId === user.id || isAdmin(user)) {
        content.destroy();
        if (isAdmin(user) && content.authorId !== user.id) {
          const flaggers = (await content.getFlaggers({ attributes: ['id'] }))
            .map(flagger => flagger.id);
          notifications.create({
            author: req.userObj,
            entity: content,
            event: events.CONTENT_DELETE,
            recipients: [...flaggers, content.authorId],
          });
          return res.sendSuccessAndLog(content, {
            message: 'Content has been deleted succesfully'
          });
        }
        return res.sendSuccess({
          message: 'Content has been deleted succesfully'
        });
      }
      throw new Error('This content belongs to another user');
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles adding comment to a content
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  addComment = async (req, res) => {
    const { userObj, content } = req;
    try {
      const comment = await models.comment.create(req.body);
      await comment.setUser(userObj);
      await comment.setContent(content);
      return res.sendSuccessAndNotify({
        event: events.COMMENT,
        recipients: [content.authorId],
        entity: content
      }, comment.get());
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles retrieving a content's comments
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  getComments = async (req, res) => {
    const { content } = req;
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;
    try {
      const comments = await models.comment.findAndCountAll({
        distinct: true,
        limit,
        offset,
        order: [[attribute, order]],
        where: { contentId: content.id },
        include: [{
          model: models.User,
          attributes: ['photo', 'fullName', 'username', 'id'],
          include: [{
            model: models.occupation,
            attributes: ['title']
          }]
        }]
      });
      const paginationMeta =
        helpers.Misc.generatePaginationMeta(req, comments, limit, offset);
      return res.sendSuccess(comments.rows, 200, paginationMeta);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles comment deletion
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  deleteComment = async (req, res) => {
    const { commentId } = req.params;
    try {
      const comment = await models.comment.findById(commentId);
      if (!comment) {
        throw new Error('Specified comment does not exist');
      }
      if (comment.UserId !== req.user.id) {
        throw new Error('This comment was added by another user');
      }
      await comment.destroy();
      return res.sendSuccess({
        message: 'Comment has been deleted succesfully'
      });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();
