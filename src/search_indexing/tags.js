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
      attributes: {
        include: [['id', 'objectID']],
        exclude: ['id', 'updatedAt', 'createdAt']
      },
      where: { ...(id && { id }) },
    });
    return this.index.addObjects(tags);
  }
}

export default new Index();

if (require.main === module) {
  new Index().sync().then(() => {
    process.exit();
  }).catch(() => {
    process.exit(2);
  });
}
