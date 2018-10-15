import Index from './base';
import models from '../models';

/**
 * @class UsersIndex
 */
class UsersIndex extends Index {
  /**
   * Creates an instance of UsersIndex.
   *
   * @memberOf UsersIndex
   */
  constructor() {
    super('dev_USERS', {
      attributesForFaceting: ['searchable(location)', 'searchable(occupation.title)'],
      searchableAttributes: ['fullName', 'username', 'bio', 'experience'],
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
    let users = await models.User.findAll({
      attributes: [['id', 'objectID'], 'fullName', 'username', 'photo', 'meta', 'createdAt'],
      where: { ...(id && { id }) },
      include: [{
        model: models.occupation,
        attributes: ['title']
      }, {
        model: models.location,
        attributes: ['name'],
        include: [{
          model: models.country,
          attributes: ['name']
        }]
      }, {
        model: models.content,
        as: 'contents',
        attributes: ['totalLikes', 'totalViews'],
        include: [{
          model: models.comment,
          attributes: ['id']
        }]
      }]
    });
    users = users.map((user) => {
      user = user.get({ plain: true });
      user.location = user.location && `${user.location.name}, ${user.location.country.name}`;
      user.bio = user.meta.bio;
      user.experience = user.meta.experience;

      user.totalLikes = user.contents.reduce((acc, content) => acc + content.totalLikes, 0);
      user.totalViews = user.contents.reduce((acc, content) => acc + content.totalViews, 0);
      user.totalComments = user.contents.reduce((acc, content) => acc + content.comments.length, 0);

      delete user.meta;
      delete user.contents;
      return user;
    });
    return this.index.addObjects(users);
  };
}

export default new UsersIndex();
