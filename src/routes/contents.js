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

const router = new Router();

router.get(
  '/',
  middleware.auth.optionalUserAuthentication,
  middleware.pagination,
  middleware.sort,
  middleware.filter,
  controllers.contents.get
);

router.get('/tags', controllers.tags.galleryTags);

router.get('/trending', controllers.tags.trendingTags);

router.get(
  '/:contentId',
  middleware.auth.optionalUserAuthentication,
  controllers.contents.getContent
);

/**               ############################################                */
router.use(middleware.auth.authenticateUser);

router.post(
  '/',
  validations.createContent,
  controllers.contents.createContent
);

router.delete(
  '/:contentId',
  validations.contentExists,
  controllers.contents.deleteContent
);

router.post(
  '/:contentId/comments',
  validations.addComment,
  validations.contentExists,
  controllers.contents.addComment
);

router.post(
  '/:contentId/flags',
  validations.flagContent,
  validations.contentExists,
  controllers.contents.flagContent
);

router.post(
  '/:contentId/like',
  validations.contentExists,
  controllers.contents.likeContent
);

router.delete(
  '/:contentId/comments/:commentId',
  controllers.contents.deleteComment
);

export default router;
