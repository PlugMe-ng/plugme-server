import { Op } from 'sequelize';
import moment from 'moment';

import models from '../models';
import helpers from '../helpers';
import { tagsSearchIndex } from '../search_indexing';

const computeTagStats = tags => tags.map((tag) => {
  tag = tag.get({ plain: true });
  tag.totalLikes = 0;
  tag.totalViews = 0;
  tag.totalComments = 0;
  tag.totalFlags = 0;
  tag.contents.forEach((content) => {
    tag.totalLikes += content.likers.length;
    tag.totalViews += content.viewers.length;
    tag.totalComments += content.comments.length;
    tag.totalFlags += content.flaggers.length;
  });

  tag.totalAchievements = tag.opportunities.length;
  tag.totalReviews = 0;
  let totalAchievementsRatings = 0;
  tag.opportunities.forEach((opportunity) => {
    tag.totalReviews += opportunity.reviews.length;
    // there would only ever be two ratings at most for a 'done' opportunity
    opportunity.reviews.forEach((review) => {
      totalAchievementsRatings += review.rating;
    });
  });
  tag.averageAchievementRating = totalAchievementsRatings / (tag.totalReviews || 1);
  delete tag.contents;
  delete tag.opportunities;
  return tag;
});

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
      tagsSearchIndex.sync(tag.id);
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
      const tag = await models.tag.findByPk(req.params.tagId);
      if (!tag) throw new Error('Specified tag does not exist');
      tag.destroy();
      tagsSearchIndex.deleteRecord(tag.id);
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
      const tag = await models.tag.findByPk(req.params.tagId);
      if (!tag) throw new Error('Specified tag does not exist');
      await tag.update({ title: req.body.title });
      tagsSearchIndex.sync(tag.id);
      return res.sendSuccessAndLog(tag, { message: 'Tag successfully updated' });
    } catch (error) {
      res.sendFailure([error.message]);
    }
  }

  /**
   * Retrieves tags along with the level of interactions with their contents within
   * the specified period
   *
   * @param {object} req - Express Request Object
   * @param {object} res - Express Response Object
   *
   * @returns {void}
   * @memberOf Controller
   */
  tagStats = async (req, res) => {
    const { where: filter } = req.meta.filter;
    const period = filter.period
      ? filter.period.split(',')
      : [moment().subtract(30, 'days').toDate(), moment().toDate()];
    const throughFilter = {
      attributes: [],
      where: { createdAt: { [Op.between]: period } }
    };

    try {
      let tags = await models.tag.findAll({
        attributes: ['id', 'title'],
        include: [{
          model: models.content,
          as: 'contents',
          attributes: ['id'],
          through: {
            attributes: []
          },
          include: [{
            model: models.User,
            as: 'likers',
            attributes: ['id'],
            through: { ...throughFilter }
          }, {
            model: models.User,
            as: 'viewers',
            attributes: ['id'],
            through: { ...throughFilter }
          }, {
            model: models.comment,
            attributes: ['id'],
            required: false,
            where: { createdAt: { [Op.between]: period } }
          }, {
            model: models.User,
            as: 'flaggers',
            attributes: ['id'],
            through: { ...throughFilter }
          }]
        }, {
          model: models.opportunity,
          as: 'opportunities',
          through: { attributes: [] },
          attributes: ['id'],
          where: { status: 'done' },
          required: false,
          include: [{
            model: models.review,
            attributes: ['id', 'rating'],
            where: { createdAt: { [Op.between]: period } }
          }]
        }]
      });
      tags = computeTagStats(tags);
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();
