import { Router } from 'express';
import middlewares from '../middleware';

import { locations as validations } from '../validations';
import { locations as controller } from '../controllers';

const { auth, check } = middlewares;

const router = new Router();

router.get('/', controller.getAllLocations);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.post('/', validations.addLocation, controller.addLocation);
router.post('/countries', validations.addCountry, controller.addCountry);
router.delete('/:locationId', controller.deleteLocation);
router.delete('/countries/:countryId', controller.deleteCountry);

export default router;
