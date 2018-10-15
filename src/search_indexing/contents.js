import moment from 'moment';

import models from '../models';
import Index from './base';

/**
 * @class ContentsIndex
 */
class ContentsIndex extends Index {
  /**
   * Creates an instance of ContentsIndex.
   * @memberOf ContentsIndex
   */
  constructor() {
    super('dev_CONTENTS', {
      searchableAttributes: ['title', 'description', 'tags.title', 'author.username', 'author.fullName'],
      attributesForFaceting: ['searchable(tags.title)', 'mediaType'],
    });
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
    let contents = await models.content.findAll({
      where: { ...(id && { id }) },
      attributes: {
        include: [['id', 'objectID']],
        exclude: ['updatedAt', 'authorId'],
      },
      include: [{
        model: models.comment,
        attributes: ['id']
      }, {
        model: models.tag,
        as: 'tags',
        attributes: ['title'],
        through: { attributes: [] }
      }, {
        model: models.User,
        as: 'author',
        attributes: ['username', 'fullName']
      }]
    });
    contents = contents.map((content) => {
      content = content.get({ plain: true });
      content.createdAt = moment(content.createdAt).valueOf();
      content.totalComments = content.comments.length;
      delete content.comments;
      return content;
    });
    return this.index.addObjects(contents);
  }
}

export default new ContentsIndex();
