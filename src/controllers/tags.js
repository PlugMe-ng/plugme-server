import { Op } from 'sequelize';

import models from '../models';
import helpers from '../helpers';

/**
 * @class Controller
 */
export default new class {
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
    const type = req.path.replace('/', '');
    const { attribute, order } = req.meta.sort;
    const { where: filter } = req.meta.filter;

    try {
      const tags = await models.tag.findAll({
        order: [[attribute, order]],
        where: {
          ...(type === 'major' && { categoryId: null }),
          ...(type === 'minor' && { categoryId: { [Op.ne]: null } }),
          ...(filter.categoryId && { categoryId: filter.categoryId })
        }
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
      return res.sendSuccessAndLog(tag);
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }

  /**
   * Handles tag deletion
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  deleteTag = async (req, res) => {
    try {
      const tag = await models.tag.findById(req.params.tagId);
      if (!tag) {
        throw new Error('Specified tag does not exist');
      }
      tag.destroy();
      return res.sendSuccessAndLog(tag, { message: 'Tag successfully deleted' });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }

  /**
   * Handles updating a tag
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  updateTag = async (req, res) => {
    try {
      const tag = await models.tag.findById(req.params.tagId);
      if (!tag) {
        throw new Error('Specified tag does not exist');
      }
      await tag.update({ title: req.body.title });
      return res.sendSuccessAndLog(tag, { message: 'Tag successfully updated' });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
}();
