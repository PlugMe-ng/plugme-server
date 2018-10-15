import algoliasearch from 'algoliasearch';
import config from '../config';

const client = algoliasearch(config.ALGOLIA_APP_NAME, config.ALGOLIA_API_KEY);

/**
 * @class UsersIndex
 */
export default class Index {
  /**
   * Creates an instance of Index.
   * @param {string} indexName
   * @param {Object} settings
   *
   * @memberOf UsersIndex
   */
  constructor(indexName, settings = {}) {
    this.index = client.initIndex(indexName);
    this.index.setSettings(settings);
  }

  /**
   * Deletes a record from the index
   * @param {string} objectId
   *
   * @returns {void}
   *
   * @memberOf ContentsIndex
   */
  deleteRecord = objectId => this.index.deleteObject(objectId)

  /**
   * Synchronizes a record with the specified id or synchronizes the entire index
   * if the id is not specified
   * @param {string} [objectId] - id of a record to sync
   *
   * @returns {void}
   * @abstract @memberof ContentsIndex
   */
  sync = (objectId) => {
    throw new Error('syncIndex method must be overridden');
  }
}
