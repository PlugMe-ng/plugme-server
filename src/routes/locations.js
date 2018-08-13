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

const { auth, check } = middlewares;

const routes = new Router();

routes.get('/', controllers.locations.getAllLocations);

routes.post(
  '/',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  validations.locations.addLocation,
  controllers.locations.addLocation
);

routes.post(
  '/countries',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  validations.locations.addCountry,
  controllers.locations.addCountry
);

export default routes;
