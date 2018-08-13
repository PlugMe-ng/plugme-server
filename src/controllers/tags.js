import models from '../models';

export default {
  getTags: async (req, res) => {
    try {
      const tags = await models.tag.findAll();
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  },

  getMinorTags: async (req, res) => {
    try {
      const tags = await models.tag.findAll({
        where: {
          categoryId: {
            [models.sequelize.Op.ne]: null
          },
        }
      });
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
};
