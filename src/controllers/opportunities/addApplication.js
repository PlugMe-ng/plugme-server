import moment from 'moment';
import { Op } from 'sequelize';

import models from '../../models';
import helpers, { events } from '../../helpers';

const { Misc: { subscriptionPlans } } = helpers;

/**
 * @desc Checks if the specified user can apply for the specified opportunity
 *
 * @param {Object} opportunity opportunity
 * @param {Object} user user
 * @param {Number} maxEntries
 *
 * @returns {void}
 */
const opportunityApplicationChecks = async (opportunity, user) => {
  const REQUIRED_USER_CONTENTS_COUNT = 1;
  const errorMessages = {
    OPPORTUNITY_NOT_FOUND: 'Job with the specified id does not exist',
    OPPORTUNITY_PLUGGER_NOT_ALLOWED: 'You cannot apply for a job you created',
    // HAS_PENDING_REVIEW: 'Kindly submit all outstanding reviews to get plugged to a new opportunity',
    OPPORTUNITY_NOT_AVAILABLE: 'This job has passed',
    VERIFIED_ACHIEVERS_ONLY: 'Please verify your portfolio to get plugged to this job',
    NOT_MATCHING_ALLOW_PLANS: 'You can only get plugged to this job when ' +
    'you match the Achiever Needed by the Plugger.',
    NOT_MATCHING_SKILLS_OCCUPATION: 'You can only get plugged to this job when you ' +
    'match the Skills or Position Needed by the Plugger.',
    NO_MATCHING_CONTENTS: 'You can only get plugged to this job if you have' +
    ' an uploaded content that matches the skills needed by the Plugger.',
    NO_MATCHING_LOCATION: 'You can only get plugged to this job when you ' +
      'match the Location indicated by the Plugger',
    OPP_APP_COUNT_THRESHOLD_SURPASSED: 'You have surpassed your monthly limit, ' +
      'please upgrade your plan to get plugged to more jobs.',
    OPPORTUNITY_EXPIRED: 'Sorry, the deadline for this job has passed.'
  };

  if (!opportunity) throw new Error(errorMessages.OPPORTUNITY_NOT_FOUND);
  if (opportunity.pluggerId === user.id) {
    throw new Error(errorMessages.OPPORTUNITY_PLUGGER_NOT_ALLOWED);
  }
  // if (user.hasPendingReview) throw new Error(errorMessages.HAS_PENDING_REVIEW);
  if (opportunity.status !== 'available') throw new Error(errorMessages.OPPORTUNITY_NOT_AVAILABLE);
  if (moment().isAfter(opportunity.deadline)) throw new Error(errorMessages.OPPORTUNITY_EXPIRED);
  if (opportunity.verifiedAchieversOnly && !user.profileVerified) {
    throw new Error(errorMessages.VERIFIED_ACHIEVERS_ONLY);
  }
  if (!opportunity.allowedplans.includes(user.plan.type)) {
    throw new Error(errorMessages.NOT_MATCHING_ALLOW_PLANS);
  }

  const hasAtLeastOneMatchingTag = (await user.getSkills({
    joinTableAttributes: [],
    where: {
      id: opportunity.tags.map(tag => tag.id)
    }
  })).length > 0;
  if (!hasAtLeastOneMatchingTag && opportunity.occupationId !== user.occupationId) {
    throw new Error(errorMessages.NOT_MATCHING_SKILLS_OCCUPATION);
  }

  // has uploaded contents with tags matching opportunity tags
  const matchingContentsCount = await user.countContents({
    includeIgnoreAttributes: false,
    include: [{
      model: models.tag,
      attributes: [],
      as: 'tags',
      where: {
        id: opportunity.tags.map(tag => tag.id)
      }
    }]
  });
  if (matchingContentsCount < REQUIRED_USER_CONTENTS_COUNT) {
    throw new Error(errorMessages.NO_MATCHING_CONTENTS);
  }

  const userHasMatchingLocation = !!(await models.User.findOne({
    where: {
      id: user.id,
      ...((opportunity.locationId || opportunity.lgaId) && {
        ...(opportunity.lgaId ? { lgaId: opportunity.lgaId }
          : { locationId: opportunity.locationId })
      })
    }
  }, {
    ...(opportunity.countryId && {
      include: [{
        model: models.location,
        where: { countryId: opportunity.countryId }
      }]
    })
  }));
  if (!userHasMatchingLocation) throw new Error(errorMessages.NO_MATCHING_LOCATION);

  if (user.plan.type === subscriptionPlans.PROFESSIONAL.name) {
    const MONTHLY_OPP_APP_COUNT_THRESHOLD = 10;
    const countMonthToDateAppliedOpp = await user.countAppliedOpportunities({
      through: {
        where: {
          createdAt: { [Op.between]: [moment().startOf('month').toDate(), moment().toDate()] }
        }
      }
    });
    if (countMonthToDateAppliedOpp >= MONTHLY_OPP_APP_COUNT_THRESHOLD) {
      throw new Error(errorMessages.OPP_APP_COUNT_THRESHOLD_SURPASSED);
    }
  }
};

export default async (req, res) => {
  const MAX_ENTRIES = 40;

  const { userObj } = req;
  const { opportunityId } = req.params;
  try {
    const opportunity = await models.opportunity.findByPk(opportunityId, {
      include: [{
        model: models.User,
        as: 'plugEntries',
        attributes: ['id'],
        through: { attributes: [] }
      }, {
        model: models.tag,
        as: 'tags',
        attributes: ['id', 'title'],
        through: { attributes: [] }
      }]
    });
    await opportunityApplicationChecks(opportunity, userObj);

    await opportunity.addPlugEntry(userObj);
    const totalPlugEntries = opportunity.plugEntries.length + 1;
    if (totalPlugEntries === MAX_ENTRIES) await opportunity.update({ status: 'pending' });

    const { plugEntries, ...data } = opportunity.get({ plain: true });
    // send notification for first 4 entries and on multiples of 4
    return totalPlugEntries < 4 || (totalPlugEntries % 4 === 0)
      ? res.sendSuccessAndNotify({
        event: events.OPPORTUNITY_APPLICATION,
        recipients: [opportunity.pluggerId],
        entity: opportunity,
        includeEmail: true
      }, {
        message: 'Job plugged successfully'
      }, 200, { ...data })
      : res.sendSuccess({
        message: 'Job plugged successfully'
      });
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};
