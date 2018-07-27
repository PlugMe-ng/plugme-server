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
      res.sendFailure([error.message]);
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
  }
};
