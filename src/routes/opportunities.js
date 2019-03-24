/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';

import middleware from '../middleware';
import { opportunities as validations } from '../validations';
import * as controller from '../controllers/opportunities';

const { auth, check } = middleware;

const router = new Router();

router.get('/', auth.optionalUserAuthentication, controller.getAllOpportunities);
router.get('/:opportunityId', controller.getOpportunity);
router.get('/:opportunityId/applications', controller.getOpportunityApplications);

router.use(auth.authenticateUser);

router.post(
  '/',
  check.userProfileUpdated,
  validations.createOpportunity,
  validations.verifyTags,
  controller.createOpportunity
);

router.delete(
  '/:opportunityId',
  check.currentUserIsAdmin,
  controller.deleteOpportunity
);

router.post(
  '/:opportunityId/applications',
  check.userHasActiveSubscription,
  controller.addOpportunityApplication
);

router.post(
  '/:opportunityId/reviews',
  validations.reviewOpportunity,
  controller.addOpportunityReview,
);

router.post(
  '/:opportunityId/applications/:userId',
  controller.setOpportunityAchiever
);

export default router;
