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
import validations from '../middleware/validations';

const controller = new Users();
const router = new Router();

const { users: validation } = validations;
const {
  check, pagination, sort, filter
} = middleware;

router.get('/:username', controller.getByUsername);
router.get('/:username/fans', pagination, controller.getUserFans);
router.get('/:username/fanOf', pagination, controller.getUserFansOf);

router.use(middleware.auth.authenticateUser);

router.post('/:username/fans', controller.addFan);

router.get(
  '/',
  check.currentUserIsAdmin,
  middleware.pagination,
  sort,
  filter,
  controller.get
);

router.put(
  '/',
  validation.userUpdate,
  controller.update
);

router.put(
  '/:userId',
  check.currentUserIsAdmin,
  validation.adminUserUpdate,
  controller.adminUserUpdate
);

export default router;
