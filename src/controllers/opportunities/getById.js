import models from '../../models';

const associations = () => [{
  model: models.User,
  as: 'plugger',
  attributes: ['id', 'username', 'fullName']
}, {
  model: models.tag,
  attributes: ['id', 'title'],
  as: 'tags',
  through: { attributes: [] }
}, {
  model: models.localgovernment,
  attributes: ['id', 'name'],
  include: [{
    model: models.location,
    attributes: ['id', 'name'],
    include: [{
      model: models.country,
      attributes: ['id', 'name'],
    }]
  }]
}, {
  model: models.location,
  attributes: ['id', 'name'],
  include: [{
    model: models.country,
    attributes: ['id', 'name']
  }]
}, {
  model: models.country,
  attributes: ['id', 'name'],
}, {
  model: models.occupation,
  as: 'positionNeeded',
  attributes: ['id', 'title']
}, {
  model: models.User,
  as: 'achiever',
  attributes: ['id', 'username', 'fullName']
}, {
  model: models.review,
}];

export default async (req, res) => {
  const { opportunityId } = req.params;
  try {
    const opportunity = await models.opportunity.findByPk(opportunityId, {
      include: associations()
    });
    if (!opportunity) throw new Error('Specified job does not exist');
    return res.sendSuccess(opportunity);
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};
