import models from '../models';

export default {
  getTags: async (req, res) => {
    try {
      const tags = await models.minorTag.findAll();
      res.sendSuccess(tags);
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
};
