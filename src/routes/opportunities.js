/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';
import controllers from '../controllers';
import middleware from '../middleware';

const { validations: { opportunities: validation }, auth, check } = middleware;
const { opportunities: controller } = controllers;

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
  validation.createOpportunity,
  validation.verifyTags,
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
  validation.reviewOpportunity,
  controller.reviewOpportunity,
);

router.post(
  '/:opportunityId/applications/:userId',
  controller.setOpportunityAchiever
);

export default router;
