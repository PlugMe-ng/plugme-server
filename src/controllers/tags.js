import { Op } from 'sequelize';

import models from '../models';

/**
 * @class Controller
 */
class Controller {
  /**
   * Retrieves all tags
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  getTags = async (req, res) => {
    try {
      const isMajorTagsRequest = req.originalUrl.endsWith('major');
      const isMinorTagsRequest = req.originalUrl.endsWith('minor');

      const tags = await models.tag.findAll({
        ...((isMajorTagsRequest || isMinorTagsRequest) && {
          where: {
            ...(isMajorTagsRequest && { categoryId: null }),
            ...(isMinorTagsRequest && { categoryId: { [Op.ne]: null } })
          }
        })
      });
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles tag creation
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  createTag = async (req, res) => {
    try {
      const tag = await models.tag.create(req.body);
      return res.sendSuccess(tag);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}

export default new Controller();
