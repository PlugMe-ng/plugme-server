import { Router } from 'express';
import middlewares from '../middleware';

import { locations as validations } from '../validations';
import { locations as controller } from '../controllers';

const { auth, check } = middlewares;

const router = new Router();

router.get('/', controller.getAllLocations);
router.get('/:locationId/lgas', controller.getLgasByLocation);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.post('/', validations.addLocation, controller.addLocation);
router.put('/:locationId', controller.updateLocation);
router.delete('/:locationId', controller.deleteLocation);

router.post('/countries', validations.addCountry, controller.addCountry);
router.delete('/countries/:countryId', controller.deleteCountry);
router.put('/countries/:countryId', controller.updateCountry);

router.post('/lgas', controller.addLga);
router.delete('/lgas/:lgaId', controller.deleteLga);
router.put('/lgas/:lgaId', controller.updateLga);

export default router;
