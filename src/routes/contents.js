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

export default routes;
