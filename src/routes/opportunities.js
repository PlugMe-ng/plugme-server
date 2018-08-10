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

const { validations: { opportunities: validation } } = middleware;
const { opportunities: controller } = controllers;

const routes = new Router();

routes.post(
  '/',
  middleware.auth.authenticateUser,
  middleware.check.userHasPendingReview,
  validation.createOpportunity,
  validation.verifyTags,
  controller.createOpportunity
);

routes.get(
  '/',
  middleware.pagination,
  middleware.sort,
  middleware.filter,
  controller.get
);

routes.get('/:opportunityId', controller.getOpportunityById);

routes.post(
  '/:opportunityId/applications',
  middleware.auth.authenticateUser,
  middleware.check.userHasPendingReview,
  controller.opportunityApplication
);

routes.get('/:opportunityId/applications', controller.getOpportunityApplications);

routes.post(
  '/:opportunityId/applications/:userId',
  middleware.auth.authenticateUser,
  controller.setOpportunityAchiever
);

routes.post(
  '/:opportunityId/reviews',
  middleware.auth.authenticateUser,
  validation.reviewOpportunity,
  controller.reviewOpportunity,
);

export default routes;
