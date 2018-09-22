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
import { opportunities as controller } from '../controllers';

const { auth, check } = middleware;

const router = new Router();

router.get(
  '/',
  middleware.pagination,
  middleware.sort,
  middleware.search,
  middleware.filter,
  controller.get
);
router.get('/:opportunityId', controller.getOpportunityById);
router.get('/:opportunityId/applications', controller.getOpportunityApplications);

router.use(auth.authenticateUser);

router.post(
  '/',
  check.userHasActiveSubscription,
  check.userHasPendingReview,
  validations.createOpportunity,
  validations.verifyTags,
  controller.createOpportunity
);

router.delete(
  '/:opportunityId',
  check.currentUserIsAdmin,
  controller.delete
);

router.post(
  '/:opportunityId/applications',
  check.userHasActiveSubscription,
  check.userHasPendingReview,
  controller.opportunityApplication
);

router.post(
  '/:opportunityId/reviews',
  validations.reviewOpportunity,
  controller.reviewOpportunity,
);

router.post(
  '/:opportunityId/applications/:userId',
  controller.setOpportunityAchiever
);

export default router;
