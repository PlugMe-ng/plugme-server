import { Router } from 'express';
import middleware from '../middleware';

import { bannerAds as controller } from '../controllers';

const { auth, check } = middleware;
const router = new Router();

router.get('/', controller.get);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
