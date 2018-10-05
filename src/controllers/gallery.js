import { Op } from 'sequelize';

import models from '../models';
import helpers, { cache } from '../helpers';

const sortFn = (a, b) => b.totalLikes - a.totalLikes;

/**
 * Computes the cummulative stats for major tags through their minor tags
 * and contents
 *
 * @param {any} tags
 *
 * @return {Array.<object>} - an array of the tags
 */
const getCummulativeStats = tags => tags.map((tag) => {
  tag = tag.get({ plain: true });

  tag.totalComments = 0;
  tag.totalLikes = 0;
  tag.totalViews = 0;

  tag.contents.forEach((content) => {
    tag.totalComments += content.comments.length;
    tag.totalLikes += content.totalLikes;
    tag.totalViews += content.totalViews;
  });

  delete tag.contents;

  const { minorTags } = tag;

  minorTags.forEach((minorTag) => {
    minorTag.contents.forEach((content) => {
      tag.totalComments += content.comments.length;
      tag.totalLikes += content.totalLikes;
      tag.totalViews += content.totalViews;
    });
  });

  delete tag.minorTags;
  return tag;
});

/**
 * Computes the cumulative likes for a list of major tags through their contents
 * @param {any} tags
 *
 * @returns {Array.<object>} tags
 */
const computeCumulativeLikes = tags =>
  tags.map((tag) => {
    tag = tag.get({ plain: true });
    tag.totalLikes = 0;
    tag.contents.forEach((content) => {
      tag.totalLikes += content.likers.length;
    });
    tag.minorTags.forEach((minorTag) => {
      minorTag.contents.forEach((content) => {
        tag.totalLikes += content.likers.length;
      });
    });
    return tag;
  });

/**
 * Retrieves a list of all major tags including their minor tags and sorted
 * according to the number of likes gathered by their contents within the last
 * 24 hours
 *
 * @returns {Array.<string>} -
 */
const getTagsRankedByRecentLikes = async () => {
  const contentAssociation = {
    model: models.content,
    as: 'contents',
    attributes: ['id'],
    through: { attributes: [] },
    include: [{
      model: models.User,
      as: 'likers',
      attributes: ['id'],
      required: true,
      through: {
        attributes: [],
        where: { createdAt: { [Op.gt]: helpers.Misc.getTimeFromNow(1) } },
      }
    }],
  };

  const tags = await models.tag.findAll({
    where: { categoryId: null },
    attributes: ['id'],
    include: [{ ...contentAssociation }, {
      model: models.tag,
      as: 'minorTags',
      attributes: ['id'],
      include: [{ ...contentAssociation }]
    }]
  });
  return computeCumulativeLikes(tags).sort(sortFn).map(tag => tag.id);
};

/**
 * @class ContentsController
 */
export default new class {
  /**
   * Handles retrieving all major tags including the accumlated stats from contents
   * that belong to them.
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  galleryTagsMajor = async (req, res) => {
    const CACHE_KEY = ['tags', 'major'];

    try {
      const cachedTags = await cache.hget(...CACHE_KEY);
      if (cachedTags) return res.sendSuccess(JSON.parse(cachedTags));

      let tags = await models.tag.findAll({
        where: { categoryId: null },
        attributes: ['id', 'title'],
        include: [{
          model: models.content,
          as: 'contents',
          attributes: ['totalLikes', 'totalViews'],
          through: { attributes: [] },
          include: [{ model: models.comment, attributes: ['id'] }]
        }, {
          model: models.tag,
          as: 'minorTags',
          attributes: ['id'],
          include: [{
            model: models.content,
            as: 'contents',
            attributes: ['totalLikes', 'totalViews'],
            through: { attributes: [] },
            include: [{ model: models.comment, attributes: ['id'] }]
          }]
        }]
      });

      tags = getCummulativeStats(tags);
      const tagsRankedByRecentLikes = (await getTagsRankedByRecentLikes());

      const tagsSortedByRecentLikes = [];

      tags.forEach((tag) => {
        const index = tagsRankedByRecentLikes.findIndex(id => tag.id === id);
        tagsSortedByRecentLikes[index] = tag;
      });
      cache.hmset(...CACHE_KEY, JSON.stringify(tagsSortedByRecentLikes));
      return res.sendSuccess(tagsSortedByRecentLikes);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles retrieving all minor tags including the accumlated stats from contents
   * that belong to them.
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  galleryTagsMinor = async (req, res) => {
    try {
      let tags = await models.tag.findAll({
        where: { categoryId: req.params.categoryId ? req.params.categoryId : { [Op.ne]: null } },
        order: [['contents', 'totalLikes', 'DESC']],
        include: [{
          model: models.content,
          as: 'contents',
          attributes: ['id', 'mediaUrls', 'mediaType', 'totalLikes', 'totalViews'],
          through: { attributes: [] },
          include: [{
            model: models.comment,
            attributes: ['id']
          }]
        }]
      });
      tags = tags.map((tag) => {
        tag = tag.get({ plain: true });
        tag.totalLikes = 0;
        tag.totalViews = 0;
        tag.totalComments = 0;
        tag.contents.forEach((content) => {
          tag.totalLikes += content.totalLikes;
          tag.totalViews += content.totalViews;
          tag.totalComments += content.comments.length;
        });
        tag.contents = tag.contents.slice(0, 1);
        return tag;
      });
      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles retrieving trending tags.
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  trendingTags = async (req, res) => {
    try {
      const tags = await models.tag.findAll({
        where: { categoryId: { [Op.ne]: null } },
        order: [['contents', 'totalLikes', 'DESC']],
        include: [{
          model: models.content,
          as: 'contents',
          attributes: { exclude: ['flagCount'] },
          required: true,
          through: { attributes: [] },
          include: [{
            model: models.comment,
            attributes: ['id', 'UserId'],
          }, {
            model: models.User,
            as: 'author',
            attributes: ['fullName', 'username', 'id'],
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
            required: true,
            through: {
              attributes: [],
              where: { createdAt: { [Op.gt]: helpers.Misc.getTimeFromNow(1) } },
            }
          }],
        }]
      });

      const contents = tags.map((tag) => {
        tag = tag.get({ plain: true });
        tag.totalLikes = 0;
        tag.contents.forEach((content) => {
          tag.totalLikes += content.likers.length;
        });
        return tag;
      }).sort(sortFn)
        .slice(0, 25)
        .map((tag) => {
          const content = tag.contents[0];
          delete tag.contents;
          delete tag.totalLikes;
          content.tags = [tag];
          return content;
        });

      return res.sendSuccess(contents);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * @method getUserGallery
   * @desc Retrieves a user gallery contents
   *
   * @param { object } req request
   * @param { object } res response
   *
   * @returns {void}
   */
  getUserGallery = async (req, res) => {
    const user = req.userObj;
    const { limit, offset } = req.meta.pagination;
    const { attribute, order } = req.meta.sort;

    try {
      const userInterestTags = (await user.getInterests({
        joinTableAttributes: [],
        attributes: ['id']
      })).map(tag => tag.id);

      const count = await user.countGalleryContents();
      const contents = await user.getGalleryContents({
        limit,
        offset,
        attributes: { exclude: ['flagCount'] },
        order: [[attribute, order]],
        joinTableAttributes: [],
        include: [{
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          where: { id: userInterestTags },
          through: { attributes: [] }
        }, {
          model: models.User,
          as: 'author',
          attributes: ['id', 'username', 'fullName']
        }, {
          model: models.comment,
          attributes: ['UserId']
        }, {
          model: models.User,
          as: 'likers',
          attributes: ['id'],
          through: { attributes: [] }
        }, {
          model: models.User,
          as: 'viewers',
          attributes: ['id'],
          through: { attributes: [] }
        }]
      });
      const pagination = helpers.Misc.generatePaginationMeta(req, { count }, limit, offset);
      return res.sendSuccess(contents, 200, { pagination });
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}();
