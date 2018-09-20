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
import { locations as validations } from '../validations';

const { auth, check } = middlewares;

const routes = new Router();

routes.get(
  '/',
  sort,
  controllers.locations.getAllLocations
);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post(
  '/',
  validations.addLocation,
  controllers.locations.addLocation
);

routes.post(
  '/countries',
  validations.addCountry,
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
