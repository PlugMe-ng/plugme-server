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
  '/:contentId',
  middleware.auth.optionalUserAuthentication,
  controllers.contents.getContent
);

routes.post(
  '/:contentId/like',
  middleware.auth.authenticateUser,
  controllers.contents.likeContent
);

routes.delete(
  '/:contentId',
  middleware.auth.authenticateUser,
  controllers.contents.deleteContent
);

routes.post(
  '/:contentId/comments',
  middleware.auth.authenticateUser,
  validations.addComment,
  controllers.contents.addComment
);

routes.delete(
  '/:contentId/comments/:commentId',
  middleware.auth.authenticateUser,
  controllers.contents.deleteComment
);

export default routes;
