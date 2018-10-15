import BaseIndex from './base';
import models from '../models';

/**
 * @class Index
 * @extends {BaseIndex}
 */
class Index extends BaseIndex {
  /**
   * Creates an instance of Index.
   *
   * @memberOf Index
   */
  constructor() {
    super('dev_TAGS');
  }

  /**
   * Synchronizes a record with the specified id or synchronizes the entire index
   * if the id is not specified
   * @param {string} [id] - id of a record to sync
   *
   * @returns {void}
   * @memberOf ContentsIndex
   */
  sync = async (id) => {
    const tags = await models.tag.findAll({
      includeIgnoreAttributes: false,
      group: ['tag.id'],
      attributes: {
        include: [
          ['id', 'objectID'],
          [models.sequelize.fn('sum', models.sequelize.col('contents.totalLikes')), 'totalLikes'],
          [models.sequelize.fn('sum', models.sequelize.col('contents.totalViews')), 'totalViews'],
          [models.sequelize.fn('count', models.sequelize.col('contents->comments.contentId')), 'totalComments'],
        ],
        exclude: ['id', 'updatedAt', 'createdAt', 'categoryId']
      },
      where: { ...(id && { id }) },
      include: [{
        model: models.content,
        as: 'contents',
        attributes: [],
        through: { attributes: [] },
        include: [{
          model: models.comment,
          attributes: []
        }]
      }]
    });
    return this.index.addObjects(tags);
  }
}

export default new Index();
