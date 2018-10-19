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
    super('CONTENTS', {
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
        exclude: ['updatedAt', 'authorId', 'totalLikes', 'totalViews', 'flagCount'],
      },
      include: [{
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
      return content;
    });
    return this.index.addObjects(contents);
  }
}

export default new ContentsIndex();

if (require.main === module) {
  new ContentsIndex().sync().then(() => {
    process.exit();
  }).catch(() => {
    process.exit(2);
  });
}
