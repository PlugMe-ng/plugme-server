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
import sort from '../middleware/sort';
import filter from '../middleware/filter';

const controller = new Users();
const routes = new Router();

const { users: validation } = validations;
const { check } = middleware;

routes.get('/:username', controller.getByUsername);

routes.use(middleware.auth.authenticateUser);

routes.post('/:username/fans', controller.addFan);

routes.get(
  '/',
  check.currentUserIsAdmin,
  middleware.pagination,
  sort,
  filter,
  controller.get
);

routes.put(
  '/:userId',
  check.currentUserIsAdmin,
  validation.updateUser,
  controller.adminUserUpdate
);

export default routes;
