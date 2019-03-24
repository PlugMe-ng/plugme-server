import { Op } from 'sequelize';
import models from '../../models';
import helpers from '../../helpers';

const { Misc: { isAdmin } } = helpers;

const associations = (filter, user) => [
  {
    model: models.localgovernment,
    attributes: ['id', 'name'],
    include: [
      {
        model: models.location,
        attributes: ['id', 'name'],
        include: [
          {
            model: models.country,
            attributes: ['id', 'name']
          }
        ]
      }
    ]
  },
  {
    model: models.location,
    attributes: ['id', 'name', 'countryId'],
    ...((filter.location || filter.country) && {
      where: {
        ...(filter.location ?
          { id: filter.location } : { countryId: filter.country })
      }
    }),
    include: [{
      model: models.country,
      attributes: ['id', 'name'],
    }]
  },
  {
    model: models.country,
    attributes: ['id', 'name']
  },
  {
    model: models.tag,
    as: 'tags',
    attributes: ['id', 'title'],
    ...(filter.tags && {
      where: {
        title: {
          [Op.iLike]: {
            [Op.any]: filter.tags.split(',').map(tag => tag.trim())
          }
        }
      }
    }),
    through: { attributes: [] }
  },
  {
    model: models.User,
    as: 'plugger',
    attributes: ['id', 'username', 'fullName', 'photo', 'occupationId'],
    ...(filter.plugger && {
      where: { username: { [Op.iLike]: filter.plugger } }
    }),
    include: [
      {
        model: models.occupation,
        attributes: ['id', 'title']
      }
    ]
  },
  {
    model: models.review
  },
  {
    model: models.User,
    attributes: ['id', 'username', 'fullName'],
    as: 'achiever',
    ...(filter.achiever && {
      where: { username: { [Op.iLike]: filter.achiever } }
    })
  },
  ...(isAdmin(user)
    ? [{
      model: models.User,
      as: 'plugEntries',
      attributes: ['id'],
      through: { attributes: [] }
    }]
    : [])
];

const getFilter = (filter, query) => ({
  ...(filter.budget && { budget: { [Op.lte]: filter.budget } }),
  ...(filter.status && { status: filter.status.toLowerCase() }),
  ...(query && {
    [Op.or]: [
      { title: { [Op.iLike]: `%${query}%` } },
      { responsibilities: { [Op.iLike]: `%${query}%` } }
    ]
  }),
  ...(filter.createdAt && {
    createdAt: { [Op.between]: filter.createdAt.split(',') }
  })
});

export default async (req, res) => {
  const { limit, offset } = req.meta.pagination;
  const { attribute, order } = req.meta.sort;
  const { where: filter } = req.meta.filter;
  const { query } = req.meta.search;

  try {
    const opportunities = await models.opportunity.findAndCountAll({
      distinct: true,
      limit,
      offset,
      order: [[attribute, order]],
      where: getFilter(filter, query),
      include: associations(filter, req.user)
    });

    // TODO: include in query directly
    if (isAdmin(req.user)) {
      opportunities.rows = opportunities.rows.map((opportunity) => {
        opportunity = opportunity.get();
        opportunity.totalPlugEntries = opportunity.plugEntries.length;
        delete opportunity.plugEntries;
        return opportunity;
      });
    }
    return res.sendSuccessWithPaginationMeta(opportunities);
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};
