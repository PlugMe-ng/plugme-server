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

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post(
  '/',
  validations.locations.addLocation,
  controllers.locations.addLocation
);

routes.post(
  '/countries',
  validations.locations.addCountry,
  controllers.locations.addCountry
);

routes.delete(
  '/:locationId',
  controllers.locations.deleteLocation
);

routes.delete(
  '/countries/:countryId',
  controllers.locations.deleteCountry
);

export default routes;
