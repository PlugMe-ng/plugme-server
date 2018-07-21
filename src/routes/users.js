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

const usersController = new Users();
const routes = new Router();

routes.get('/:username', usersController.getByUsername);

routes.use(middleware.auth.authenticateUser);

routes.get('/', middleware.pagination, usersController.get);
routes.put('/:userId', usersController.updateById);
routes.delete('/:userId', usersController.deleteById);

export default routes;
