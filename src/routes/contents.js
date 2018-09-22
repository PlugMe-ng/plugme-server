import { Router } from 'express';

import middleware from '../middleware';
import { contents as validations } from '../validations';
import { contents as controller } from '../controllers';

const router = new Router();

router.get(
  '/',
  middleware.auth.optionalUserAuthentication,
  controller.get
);

router.get(
  '/:contentId',
  middleware.auth.optionalUserAuthentication,
  controller.getContent
);

router.get(
  '/:contentId/comments',
  validations.contentExists,
  controller.getComments
);

/**               ############################################                */
router.use(middleware.auth.authenticateUser);

router.post(
  '/',
  middleware.check.userHasActiveSubscription,
  validations.createContent,
  validations.checkMinorTagInclusion,
  validations.userPlanLimit,
  controller.createContent
);

router.delete(
  '/:contentId',
  validations.contentExists,
  controller.deleteContent
);

router.post(
  '/:contentId/comments',
  validations.addComment,
  validations.contentExists,
  controller.addComment
);

router.post(
  '/:contentId/flags',
  validations.flagContent,
  validations.contentExists,
  controller.flagContent
);

router.post(
  '/:contentId/like',
  validations.contentExists,
  controller.likeContent
);

router.delete(
  '/:contentId/comments/:commentId',
  controller.deleteComment
);

export default router;
