/**
 * @fileOverview users routes
 *
 * @author Franklin Chieze
 *
 * @requires NPM:express
 * @requires ../controllers/Users
 * @requires ../middleware
 */

import { Router } from 'express';

import middleware from '../middleware';
import Validations from '../middleware/validations';
import controllers from '../controllers';

const { contents: validations } = Validations;

const routes = new Router();

routes.post(
  '/',
  middleware.auth.authenticateUser,
  validations.createContent,
  controllers.contents.createContent
);

routes.get(
  '/',
  middleware.auth.optionalUserAuthentication,
  middleware.pagination,
  middleware.sort,
  controllers.contents.get
);

routes.get(
  '/:contentId',
  middleware.auth.optionalUserAuthentication,
  controllers.contents.getContent
);

routes.post(
  '/:contentId/like',
  middleware.auth.authenticateUser,
  validations.contentExists,
  controllers.contents.likeContent
);

routes.post(
  '/:contentId/flags',
  middleware.auth.authenticateUser,
  validations.flagContent,
  validations.contentExists,
  controllers.contents.flagContent
);

routes.delete(
  '/:contentId',
  middleware.auth.authenticateUser,
  validations.contentExists,
  controllers.contents.deleteContent
);

routes.post(
  '/:contentId/comments',
  middleware.auth.authenticateUser,
  validations.addComment,
  validations.contentExists,
  controllers.contents.addComment
);

routes.delete(
  '/:contentId/comments/:commentId',
  middleware.auth.authenticateUser,
  controllers.contents.deleteComment
);

export default routes;
