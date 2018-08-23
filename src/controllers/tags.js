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
    const type = req.path.replace('/', '');

    const { where: filter } = req.meta.filter;
    const { attribute, order } = req.meta.sort;

    try {
      let tags = await models.tag.findAll({
        order: [[attribute, order]],
        where: {
          ...(type === 'major' && { categoryId: null }),
          ...(type === 'minor' && { categoryId: { [Op.ne]: null } })
        },
        ...(filter.include_stats && {
          include: [{
            model: models.content,
            as: 'contents',
            attributes: ['totalLikes', 'totalViews'],
            include: [{
              model: models.comment,
              attributes: ['id']
            }],
            through: {
              attributes: []
            }
          }]
        })
      });
      if (filter.include_stats) {
        tags = tags.map((tag) => {
          tag = tag.get({ plain: true });
          tag.totalComments = 0;
          tag.totalLikes = 0;
          tag.totalViews = 0;

          tag.contents.forEach((content) => {
            tag.totalComments = content.comments.length;
            tag.totalLikes = content.totalLikes;
            tag.totalViews = content.totalViews;
          });
          delete tag.contents;
          return tag;
        });
      }
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
}

export default new Controller();
