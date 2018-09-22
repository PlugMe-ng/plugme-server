/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';

import middlewares from '../middleware';
import sort from '../middleware/sort';
import { occupations as validations } from '../validations';
import { occupations as controller } from '../controllers';

const { auth, check } = middlewares;
const routes = new Router();

routes.get('/', sort, controller.get);

routes.use(auth.authenticateUser, check.currentUserIsAdmin);

routes.post('/', validations.addOccupation, controller.addOccupation);
routes.delete('/:occupationId', controller.deleteOccupation);

export default routes;
