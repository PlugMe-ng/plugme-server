import uuid from 'uuid/v4';

import models from '../models';
import helpers from '../helpers';

const contentAssociations = [{
  model: models.comment,
  attributes: ['id', 'UserId']
}, {
  model: models.User,
  as: 'author',
  attributes: ['fullName', 'username', 'id']
}, {
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
  model: models.view,
  attributes: ['id'],
}, {
  model: models.tag,
  attributes: ['id', 'title'],
  as: 'tags',
  through: {
    attributes: []
  }
}];

const addViewEntry = async (user, contentId) => {
  const userLastView = await models.view.findOne({
    order: [['createdAt', 'DESC']],
    where: {
      userId: user.id,
      contentId
    }
  });
  if (!userLastView) {
    await user.addViewedContent(contentId, {
      through: {
        id: uuid()
      }
    });
    return;
  }
  const midnight = new Date().setHours(0, 0, 0);
  if (midnight > new Date(userLastView.createdAt).getTime()) {
    await models.view.create({
      userId: user.id,
      contentId,
      id: uuid()
    });
  }
};

/**
 * @class ContentsController
 */
class ContentsController {
  /**
   * Gets the list of contents based on user's interest tags
   *
   * @param {Object} req
   * @param {Object} res
   *
   * @returns {void}
   * @memberOf ContentsController
   */
  getUserGallery = async (req, res) => {
    // const { limit, offset } = req.meta.pagination;
    // const { attribute, order } = req.meta.sort;
    const { userObj: user } = req;

    try {
      const tags = await user.getInterestTags({
        joinTableAttributes: [],
        order: [[{ model: models.content, as: 'contents' }, 'createdAt', 'DESC']],
        include: [{
          model: models.content,
          as: 'contents',
          include: contentAssociations,
          through: {
            attributes: []
          }
        }]
      });

      let contents = [];
      tags.forEach((tag) => {
        contents = [...contents, ...tag.contents];
      });

      // remove duplicates
      contents = contents.filter((content, index, self) =>
        self.map(obj => obj.id).indexOf(content.id) === index);

      return res.sendSuccess(contents);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

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
      content = await models.content.create(req.body);
      await content.setAuthor(userObj);
      await content.setTags(req.body.tags);
      content = await models.content.findById(content.id, {
        include: [{
          model: models.User,
          as: 'author',
          attributes: ['fullName', 'username']
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['title'],
          through: {
            attributes: []
          }
        }]
      });
      return res.sendSuccess({
        ...content.get()
      });
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

    // if (req.userObj) {
    //   return this.getUserGallery(req, res);
    // }
    try {
      const dbResult = await models.content.findAndCountAll();
      let contents = await models.content.findAll({
        limit,
        offset,
        order: [[attribute, order]],
        include: contentAssociations
      });
      contents = contents.map((content) => {
        content = content.get({ plain: true });
        content.totalViews = content.views.length;
        delete content.views;
        return content;
      });
      const pagination = helpers.Misc.generatePaginationMeta(
        req,
        dbResult,
        limit,
        offset
      );
      return res.sendSuccess({ contents }, 200, { pagination });
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
    try {
      const { userObj } = req;
      if (userObj) {
        await addViewEntry(userObj, contentId);
      }
      let content = await models.content.findById(contentId, {
        order: [[models.comment, 'createdAt', 'ASC']],
        include: [
          {
            model: models.User,
            as: 'author',
            attributes: ['id', 'username', 'fullName'],
            include: [{
              model: models.User,
              as: 'fans',
              attributes: ['id', 'username', 'fullName'],
              through: {
                attributes: []
              }
            }]
          }, {
            model: models.User,
            as: 'likers',
            attributes: ['id'],
            through: {
              attributes: []
            }
          }, {
            model: models.view,
            attributes: ['id'],
          }, {
            model: models.User,
            as: 'viewers',
            attributes: ['id'],
            through: {
              attributes: []
            }
          }, {
            model: models.comment,
            include: [{
              model: models.User,
              attributes: ['id', 'username', 'fullName']
            }]
          }, {
            model: models.tag,
            as: 'tags',
            attributes: ['id', 'title'],
            through: {
              attributes: []
            }
          }
        ]
      });
      if (!content) {
        throw new Error('Specified content does not exist');
      }
      content = content.get({ plain: true });
      content.totalViews = content.views.length;
      delete content.views;
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
        return res.sendSuccess({
          message: 'You have successfully unliked this content'
        });
      }
      await content.addLiker(userObj);
      return res.sendSuccess({
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
      // TODO: allow an admin to delete a content here
      if (content.authorId !== user.id) {
        throw new Error('This content is owned by another user');
      }
      await content.destroy();
      return res.sendSuccess({
        message: 'Content has been deleted succesfully'
      });
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
      return res.sendSuccess(comment.get());
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
}

export default new ContentsController();
