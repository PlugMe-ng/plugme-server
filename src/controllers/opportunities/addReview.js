/* eslint-disable no-use-before-define */
import models from '../../models';
import { opportunitiesSearchIndex as searchIndex } from '../../search_indexing';
import { events } from '../../helpers';


export default async (req, res) => {
  const { opportunityId } = req.params;
  const { userObj } = req;

  try {
    const opportunity = await models.opportunity.findByPk(opportunityId, {
      include: [{
        model: models.review,
        attributes: ['id']
      }]
    });

    createOpportunityReviewsChecks(opportunity, userObj);

    await models.review.create({
      ...req.body,
      opportunityId: opportunity.id,
      UserId: userObj.id
    });
    await userObj.update({ hasPendingReview: false });
    await opportunity.update({ status: 'done' });
    searchIndex.sync(opportunity.id);

    return res.sendSuccessAndNotify({
      event: events.OPPORTUNITY_REVIEW,
      entity: opportunity,
      recipients: [opportunity.achieverId]
    }, {
      message: 'Review submitted successfully'
    });
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};

/**
   * Extracted method to check if a review can be posted by the user
   * @param {object} opportunity - opportunity
   * @param {object} user -  user
   *
   * @returns {void}
   * @memberOf Controller
   */
const createOpportunityReviewsChecks = (opportunity, user) => {
  if (!opportunity) throw new Error('Specified job does not exist');
  if (!opportunity.achieverId) throw new Error('This job does not have an achiever yet');
  if (opportunity.pluggerId !== user.id) {
    throw new Error('Only the plugger of this job can post review for it');
  }
  if (opportunity.reviews.length > 0) {
    throw new Error('You already left a review for this job');
  }
};
