/**
 * @fileOverview users routes
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:express
 */
import { Router } from 'express';

import middlewares from '../middleware';
import { occupations as validations } from '../validations';
import { occupations as controller } from '../controllers';

const { auth, check } = middlewares;
const router = new Router();

router.get('/', controller.get);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.post('/', validations.addOccupation, controller.addOccupation);
router.delete('/:occupationId', controller.deleteOccupation);

export default router;
