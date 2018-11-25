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
import { users as validations } from '../validations';
import { users as controller } from '../controllers';

const router = new Router();

const { check, auth } = middleware;

router.post('/subscriptions', controller.subscription);
router.get('/conversations', auth.authenticateUser, controller.getConversations);
router.get('/conversations/unread_count', auth.authenticateUser, controller.getUnreadConversationsCount);

router.get('/:usernameOrId', controller.getByUsernameOrId);
router.get('/:username/fans', controller.getUserFans);
router.get('/:username/fanOf', controller.getUserFansOf);
router.get('/', auth.optionalUserAuthentication, controller.get);

router.use(auth.authenticateUser);

router.post('/:username/fans', controller.addFan);
router.put('/', validations.userUpdate, validations.userProfileUpdateChecks, controller.update);
router.put(
  '/:userId',
  check.currentUserIsAdmin,
  validations.adminUserUpdate,
  controller.adminUserUpdate
);

export default router;
