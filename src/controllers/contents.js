import models from '../models';

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

  getContent: async (req, res) => {
    const { contentId } = req.params;
    try {
      const { userObj } = req;
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
            attributes: ['id', 'username', 'fullName'],
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
      return res.sendSuccess(content);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  },

  likeContent: async (req, res) => {
    try {
      const { userObj } = req;
      const { contentId } = req.params;
      const content = await models.content.findById(contentId);
      if (!content) {
        throw new Error('Specified content does not exist');
      }
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

  deleteContent: async (req, res) => {
    const { contentId } = req.params;
    try {
      const content = await models.content.findById(contentId);
      if (!content) {
        throw new Error('Specified content does not exist');
      }
      // TODO: allow an admin to delete a content here
      if (content.authorId !== req.user.id) {
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
    const { contentId } = req.params;
    const { userObj } = req;
    try {
      const content = await models.content.findById(contentId);
      if (!content) {
        throw new Error('Specified content does not exist');
      }
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
