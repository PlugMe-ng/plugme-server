/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';
import controllers from '../controllers';
import middlewares from '../middleware';
import validations from '../middleware/validations';
import sort from '../middleware/sort';

const { auth, check } = middlewares;

const routes = new Router();

routes.get('/', sort, controllers.occupations.get);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post(
  '/',
  validations.occupations.addOccupation,
  controllers.occupations.addOccupation
);

routes.delete('/:occupationId', controllers.occupations.deleteOccupation);

export default routes;
