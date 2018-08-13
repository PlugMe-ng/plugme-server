/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';
import controllers from '../controllers';
import middlewares from '../middleware';
import validations from '../middleware/validations';

const { auth, check } = middlewares;

const routes = new Router();

routes.get('/', controllers.tags.getTags);

routes.get('/minor', controllers.tags.getTags);

routes.get('/major', controllers.tags.getTags);

routes.post(
  '/major',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  validations.tags.createMajorTag,
  controllers.tags.createTag
);

routes.post(
  '/minor',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  validations.tags.createMinorTag,
  controllers.tags.createTag
);

export default routes;
