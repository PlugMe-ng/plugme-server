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

const routes = new Router();

routes.post(
  '/',
  middleware.auth.authenticateUser,
  validation.createOpportunity,
  validation.verifyTags,
  controllers.opportunities.createOpportunity
);

export default routes;
