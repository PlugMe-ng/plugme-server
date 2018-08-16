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

const routes = new Router();

routes.get(
  '/',
  middleware.pagination,
  middleware.sort,
  middleware.search,
  middleware.filter,
  controller.get
);
routes.get('/:opportunityId', controller.getOpportunityById);
routes.get('/:opportunityId/applications', controller.getOpportunityApplications);

routes.use(auth.authenticateUser);

routes.post(
  '/',
  check.userHasPendingReview,
  validation.createOpportunity,
  validation.verifyTags,
  controller.createOpportunity
);

routes.delete(
  '/:opportunityId',
  check.currentUserIsAdmin,
  controller.delete
);

routes.post(
  '/:opportunityId/applications',
  check.userHasPendingReview,
  controller.opportunityApplication
);

routes.post(
  '/:opportunityId/reviews',
  validation.reviewOpportunity,
  controller.reviewOpportunity,
);

routes.post(
  '/:opportunityId/applications/:userId',
  controller.setOpportunityAchiever
);

export default routes;
