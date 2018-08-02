/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';
import controllers from '../controllers';

const routes = new Router();

routes.get('/', controllers.tags.getTags);

export default routes;
