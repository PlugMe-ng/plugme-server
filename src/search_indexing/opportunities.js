import moment from 'moment';

import models from '../models';
import Index from './base';

/**
 * @class OpportunitiesIndex
 * @extends {Index}
 */
class OpportunitiesIndex extends Index {
  /**
   * Creates an instance of OpportunitiesIndex.
   *
   * @memberOf OpportunitiesIndex
   */
  constructor() {
    super('dev_OPPORTUNITIES');
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
    let opportunities = await models.opportunity.findAll({
      where: { ...(id && { id }) },
      attributes: {
        include: [['id', 'objectID']],
        exclude: ['updatedAt', 'pluggerId', 'achieverId', 'locationId'],
      },
      include: [{
        model: models.tag,
        as: 'tags',
        attributes: ['title'],
        through: { attributes: [] }
      }, {
        model: models.review,
        attributes: ['rating']
      }, {
        model: models.location,
        attributes: ['name'],
        include: [{
          model: models.country,
          attributes: ['name']
        }]
      }, {
        model: models.User,
        as: 'plugger',
        attributes: ['username', 'fullName']
      }]
    });
    opportunities = opportunities.map((opportunity) => {
      opportunity = opportunity.get({ plain: true });
      opportunity.createdAt = moment(opportunity.createdAt).valueOf();
      opportunity.deadline = moment(opportunity.deadline).valueOf();
      opportunity.rating = opportunity.reviews
        .reduce((acc, review) => acc + review.rating, 0) / (opportunity.reviews.length || 1);
      opportunity.location = opportunity.location &&
        `${opportunity.location.name}, ${opportunity.location.country.name}`;
      delete opportunity.reviews;
      return opportunity;
    });
    return this.index.addObjects(opportunities);
  }
}

export default new OpportunitiesIndex();

if (require.main === module) {
  new OpportunitiesIndex().sync().then(() => {
    process.exit();
  }).catch(() => {
    process.exit(2);
  });
}

