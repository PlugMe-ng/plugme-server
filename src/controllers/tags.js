import { Op } from 'sequelize';

import models from '../models';
import helpers from '../helpers';

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

  let { minorTags } = tag;

  minorTags = minorTags.map((minorTag) => {
    const minorTagContent = minorTag.contents[0];

    minorTag.totalComments = 0;
    minorTag.totalLikes = 0;
    minorTag.totalViews = 0;
    minorTag.mediaUrl = minorTagContent ? minorTagContent.mediaUrls[0] : null;
    minorTag.mediaType = minorTagContent ? minorTagContent.mediaType : null;

    minorTag.contents.forEach((content) => {
      minorTag.totalComments += content.comments.length;
      minorTag.totalLikes += content.totalLikes;
      minorTag.totalViews += content.totalViews;
    });

    tag.totalComments += minorTag.totalComments;
    tag.totalLikes += minorTag.totalLikes;
    tag.totalViews += minorTag.totalViews;

    delete minorTag.contents;

    return minorTag;
  });

  tag.tags = minorTags;
  delete tag.minorTags;
  return tag;
});

const getTagsRankedByRecentLikes = async () => {
  const HRS24 = Date.now() - (3600000 * 24);

  const tags = await models.tag.findAll({
    where: { categoryId: null },
    include: [{
      model: models.tag,
      as: 'minorTags',
      include: [{
        model: models.content,
        as: 'contents',
        attributes: ['mediaUrls', 'mediaType', 'totalLikes', 'totalViews'],
        through: { attributes: [] },
        include: [{
          model: models.comment,
          attributes: ['id']
        }, {
          model: models.User,
          as: 'likers',
          attributes: [],
          required: true,
          through: {
            attributes: [],
            where: { createdAt: { [Op.gt]: HRS24 } },
          }
        }],
      }]
    }, {
      model: models.content,
      as: 'contents',
      attributes: ['mediaUrls', 'mediaType', 'totalLikes', 'totalViews'],
      through: { attributes: [] },
      include: [{
        model: models.comment,
        attributes: ['id']
      }, {
        model: models.User,
        as: 'likers',
        attributes: [],
        required: true,
        through: {
          attributes: [],
          where: { createdAt: { [Op.gt]: HRS24 } },
        }
      }],
    }]
  });
  return getCummulativeStats(tags).sort((a, b) => b.totalLikes > a.totalLikes);
};

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
    const { attribute, order } = req.meta.sort;

    try {
      const tags = await models.tag.findAll({
        order: [[attribute, order]],
        where: {
          ...(type === 'major' && { categoryId: null }),
          ...(type === 'minor' && { categoryId: { [Op.ne]: null } })
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
   * Handles retrieving all tags including the accumlated stats from contents
   * that belong to them.
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  galleryTags = async (req, res) => {
    try {
      let tags = await models.tag.findAll({
        where: { categoryId: null },
        order: [['minorTags', 'contents', 'totalLikes', 'DESC']],
        include: [{
          model: models.tag,
          as: 'minorTags',
          include: [{
            model: models.content,
            as: 'contents',
            attributes: ['mediaUrls', 'mediaType', 'totalLikes', 'totalViews'],
            include: [{
              model: models.comment,
              attributes: ['id']
            }],
            through: { attributes: [] }
          }]
        }, {
          model: models.content,
          as: 'contents',
          attributes: ['mediaUrls', 'mediaType', 'totalLikes', 'totalViews'],
          include: [{
            model: models.comment,
            attributes: ['id']
          }],
          through: { attributes: [] }
        }]
      });

      tags = getCummulativeStats(tags);
      const tagsRankedByRecentLikes = (await getTagsRankedByRecentLikes())
        .map(t => t.id);

      const tagsSortedByRecentLikes = [];

      tags.forEach((tag) => {
        const index = tagsRankedByRecentLikes.findIndex(id => tag.id === id);
        tagsSortedByRecentLikes[index] = tag;
      });
      return res.sendSuccess(tagsSortedByRecentLikes);
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
      let tags = [];
      (await getTagsRankedByRecentLikes())
        .forEach((tag) => { tags = [...tags, ...tag.tags]; });

      tags = tags
        .sort((a, b) => b.totalLikes > a.totalLikes);
      // .splice(0, 25);

      return res.sendSuccess(tags);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}

export default new Controller();
