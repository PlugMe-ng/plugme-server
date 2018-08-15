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

const usersController = new Users();
const routes = new Router();

routes.get('/:username', usersController.getByUsername);

routes.use(middleware.auth.authenticateUser);

routes.post('/:username/fans', usersController.addFan);
routes.get('/', middleware.pagination, usersController.get);

routes.put(
  '/:userId',
  middleware.check.currentUserIsAdmin,
  validations.users.updateUser,
  usersController.adminUserUpdate
);

routes.delete('/:userId', usersController.deleteById);

export default routes;
