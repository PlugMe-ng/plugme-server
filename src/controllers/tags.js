import { Op } from 'sequelize';

import models from '../models';
import helpers from '../helpers';

const sortFn = (a, b) => b.totalLikes - a.totalLikes;
const getTimeLast24Hrs = () => Date.now() - (3600000 * 24);

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

const computeCumulativeLikes = tags =>
  tags.map((tag) => {
    tag = tag.get({ plain: true });
    tag.totalLikes = 0;
    tag.contents.forEach((content) => {
      tag.totalLikes += content.totalLikes;
    });
    tag.minorTags.forEach((minorTag) => {
      minorTag.contents.forEach((content) => {
        tag.totalLikes += content.totalLikes;
      });
    });
    return tag;
  });

const getTagsRankedByRecentLikes = async () => {
  const contentAssociation = {
    model: models.content,
    as: 'contents',
    attributes: ['totalLikes'],
    through: { attributes: [] },
    include: [{
      model: models.User,
      as: 'likers',
      attributes: [],
      required: true,
      through: {
        attributes: [],
        where: { createdAt: { [Op.gt]: getTimeLast24Hrs() } },
      }
    }],
  };

  const tags = await models.tag.findAll({
    where: { categoryId: null },
    attributes: ['id'],
    include: [contentAssociation, {
      model: models.tag,
      as: 'minorTags',
      attributes: ['id'],
      include: [contentAssociation]
    }]
  });
  return computeCumulativeLikes(tags).sort(sortFn).map(tag => tag.id);
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
      return res.sendSuccess(tagsSortedByRecentLikes);
    } catch (error) {
      return res.sendFailure([error.message]);
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
              where: { createdAt: { [Op.gt]: getTimeLast24Hrs() } },
            }
          }],
        }]
      });

      const contents = tags.map((tag) => {
        tag = tag.get({ plain: true });
        tag.totalLikes = 0;
        tag.contents.forEach((content) => {
          tag.totalLikes += content.totalLikes;
        });
        tag.contents = tag.contents.slice(0, 1);
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
}

export default new Controller();
