import models from '../models';
import helpers from '../helpers';

export default {
  createContent: async (req, res) => {
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
          model: models.minorTag,
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
  },

  get: async (req, res) => {
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;
    try {
      const dbResult = await models.content.findAndCountAll();
      const contents = await models.content.findAll({
        limit,
        offset,
        order: [[attribute, order]],
        include: [{
          model: models.comment,
          attributes: ['id']
        }, {
          model: models.User,
          as: 'author',
          attributes: ['fullName']
        }, {
          model: models.User,
          as: 'viewers',
          attributes: ['id'],
          through: {
            attributes: []
          }
        }, {
          model: models.User,
          as: 'likers',
          attributes: ['id'],
          through: {
            attributes: []
          }
        }, {
          model: models.minorTag,
          attributes: ['id', 'title'],
          as: 'tags',
          through: {
            attributes: []
          }
        }]
      });
      if (contents) {
        const pagination = helpers.Misc.generatePaginationMeta(
          req,
          dbResult,
          limit,
          offset
        );
        return res.sendSuccess({ contents }, 200, { pagination });
      }
      throw new Error('Could not retrieve content from the db');
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  },

  getContent: async (req, res) => {
    const { contentId } = req.params;
    try {
      const { userObj } = req;
      if (userObj) {
        await userObj.addViewedContent(contentId);
      }
      const content = await models.content.findById(contentId, {
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
            model: models.minorTag,
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
      return res.sendSuccess(content);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  },

  likeContent: async (req, res) => {
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
  },

  flagContent: async (req, res) => {
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
  },

  deleteContent: async (req, res) => {
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
  },

  addComment: async (req, res) => {
    const { userObj, content } = req;
    try {
      const comment = await models.comment.create(req.body);
      await comment.setUser(userObj);
      await comment.setContent(content);
      return res.sendSuccess(comment.get());
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  },

  deleteComment: async (req, res) => {
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
};
