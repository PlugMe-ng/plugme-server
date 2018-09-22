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
import controllers from '../controllers';
import { contents as validations } from '../validations';

const router = new Router();

router.get(
  '/',
  middleware.auth.optionalUserAuthentication,
  middleware.pagination,
  middleware.sort,
  middleware.filter,
  controllers.contents.get
);

router.get(
  '/:contentId',
  middleware.auth.optionalUserAuthentication,
  controllers.contents.getContent
);

router.get(
  '/:contentId/comments',
  validations.contentExists,
  middleware.pagination,
  middleware.sort,
  controllers.contents.getComments
);

/**               ############################################                */
router.use(middleware.auth.authenticateUser);

router.post(
  '/',
  middleware.check.userHasActiveSubscription,
  validations.createContent,
  validations.checkMinorTagInclusion,
  validations.userPlanLimit,
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
