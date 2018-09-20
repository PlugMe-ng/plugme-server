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

import Users from '../controllers/Users';
import middleware from '../middleware';
import { users as validations } from '../validations';

const controller = new Users();
const router = new Router();

const {
  check, pagination, sort, filter
} = middleware;

router.post('/subscriptions', controller.subscription);
router.get('/:username', controller.getByUsername);
router.get('/:username/fans', pagination, controller.getUserFans);
router.get('/:username/fanOf', pagination, controller.getUserFansOf);
router.get('/', pagination, sort, filter, controller.get);

router.use(middleware.auth.authenticateUser);

router.post('/:username/fans', controller.addFan);
router.put('/', validations.userUpdate, controller.update);
router.put(
  '/:userId',
  check.currentUserIsAdmin,
  validations.adminUserUpdate,
  controller.adminUserUpdate
);

export default router;
