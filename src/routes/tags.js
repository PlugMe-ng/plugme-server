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
import { tags as validations } from '../validations';

const {
  auth, check, filter, sort
} = middlewares;

const routes = new Router();

routes.get(
  '/',
  sort,
  filter,
  controllers.tags.getTags
);

routes.get(
  '/minor',
  sort,
  filter,
  controllers.tags.getTags,
);

routes.get(
  '/major',
  sort,
  filter,
  controllers.tags.getTags
);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post(
  '/major',
  validations.createMajorTag,
  controllers.tags.createTag
);

routes.post(
  '/minor',
  validations.createMinorTag,
  controllers.tags.createTag
);

routes.delete(
  '/:tagId',
  controllers.tags.deleteTag
);

export default routes;
