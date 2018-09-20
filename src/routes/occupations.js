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
import sort from '../middleware/sort';
import { occupations as validations } from '../validations';

const { auth, check } = middlewares;

const routes = new Router();

routes.get('/', sort, controllers.occupations.get);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post(
  '/',
  validations.addOccupation,
  controllers.occupations.addOccupation
);

routes.delete('/:occupationId', controllers.occupations.deleteOccupation);

export default routes;
