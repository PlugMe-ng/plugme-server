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
import sort from '../middleware/sort';

const { auth, check } = middlewares;

const routes = new Router();

routes.get('/', controllers.tags.getTags);

routes.get(
  '/minor',
  sort,
  controllers.tags.getMinorTags,
);

routes.get(
  '/major',
  sort,
  controllers.tags.getMajorTags
);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post(
  '/major',
  validations.tags.createMajorTag,
  controllers.tags.createTag
);

routes.post(
  '/minor',
  validations.tags.createMinorTag,
  controllers.tags.createTag
);

routes.delete(
  '/:tagId',
  controllers.tags.deleteTag
);

export default routes;
