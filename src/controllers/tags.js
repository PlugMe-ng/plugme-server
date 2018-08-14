import { Op } from 'sequelize';

import models from '../models';
import helpers from '../helpers';

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
      const tags = await models.tag.findAll();
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Retrieves all major tags
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  getMajorTags = async (req, res) => {
    try {
      const tags = await models.tag.findAll({
        where: { categoryId: null }
      });
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Retrieves all minor tags
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  getMinorTags = async (req, res) => {
    try {
      const tags = await models.tag.findAll({
        where: { categoryId: { [Op.ne]: null } }
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
      await models.tag.destroy({ where: { id: req.params.tagId } });
      return res.sendSuccess({ message: 'Tag successfully deleted' });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }
}

export default new Controller();
