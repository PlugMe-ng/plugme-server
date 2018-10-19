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
    super('USERS', {
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
      attributes: [['id', 'objectID'], 'fullName', 'username', 'photo', 'meta'],
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
      }]
    });
    users = users.map((user) => {
      user = user.get({ plain: true });
      user.location = user.location && `${user.location.name}, ${user.location.country.name}`;
      user.bio = user.meta.bio;
      user.experience = user.meta.experience;

      delete user.meta;
      return user;
    });
    return this.index.addObjects(users);
  };
}

export default new UsersIndex();

if (require.main === module) {
  new UsersIndex().sync().then(() => {
    process.exit();
  }).catch(() => {
    process.exit(2);
  });
}
