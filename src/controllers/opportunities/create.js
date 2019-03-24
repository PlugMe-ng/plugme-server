import moment from 'moment';
import { Op } from 'sequelize';

import models from '../../models';
import notifications from '../notifications';
import { events } from '../../helpers';

const duplicateOpportunityUploadCheck = async (user, reqBody) => {
  if ((await user.getOpportunities({
    where: {
      title: reqBody.title,
      createdAt: { [Op.gt]: moment().subtract(10, 'minutes').toDate() }
    }
  }).length > 0)) {
    throw new Error('Duplicate job');
  }
};

/**
 * @SideEffect
 * Notifies premium and pro plan users of the new opportunity if
 * it matches their skills tags and location
 *
 * @param {any} opportunity
 *
 * @returns {void}
 */
const notifyUsers = async (opportunity) => {
  const recipients = (await models.User.findAll({
    where: {
      'plan.type': { [Op.in]: opportunity.allowedplans },
      ...(opportunity.verifiedAchieversOnly && { profileVerified: true }),
      ...((opportunity.locationId || opportunity.lgaId) && {
        ...(opportunity.lgaId ? {
          lgaId: opportunity.lgaId
        } : {
          locationId: opportunity.locationId
        })
      })
    },
    include: [...(opportunity.countryId ? [{
      model: models.location,
      where: { countryId: opportunity.countryId }
    }] : []), {
      model: models.tag,
      as: 'skills',
      attributes: ['id'],
      where: { id: opportunity.tags },
      required: false
    }, {
      model: models.occupation,
      attributes: ['id'],
      required: false,
      where: { id: opportunity.occupationId }
    }, {
      model: models.content,
      attributes: ['id'],
      as: 'contents',
      required: true,
      include: [{
        model: models.tag,
        as: 'tags',
        attributes: ['id'],
        through: { attributes: [] },
        where: { id: opportunity.tags }
      }]
    }]
  }))
    // sequelize should be able to do this directly, but using filter for now
    .filter(user => user.skills.length || user.occupation)
    .map(user => user.id);
  notifications.create({
    author: opportunity.plugger,
    event: events.NEW_OPPORTUNITY,
    recipients,
    entity: opportunity,
    includeEmail: true
  });
};

export default async (req, res) => {
  let opportunity;
  try {
    const { tags, ...reqBody } = req.body;
    const { userObj: user } = req;

    await duplicateOpportunityUploadCheck(user, reqBody);

    if (!reqBody.lgaId && !reqBody.locationId && !reqBody.countryId) {
      throw new Error('Please specify a location for this job');
    }
    if ((await user.countOpportunities({
      where: {
        status: 'pending', achieverId: { [Op.ne]: null }
      }
    })) > 0) {
      throw new Error('Kindly submit all outstanding reviews to publish a new job');
    }

    if (reqBody.lgaId) {
      delete reqBody.locationId;
      delete reqBody.countryId;
    }
    if (reqBody.locationId) delete reqBody.countryId;

    opportunity = await models.opportunity.create({
      ...reqBody,
      status: 'available',
      pluggerId: user.id
    });
    await opportunity.setTags(tags);

    notifyUsers({ ...opportunity.get(), tags });
    return res.sendSuccess(opportunity);
  } catch (error) {
    if (opportunity) opportunity.destroy();
    return res.sendFailure([error.message]);
  }
};
