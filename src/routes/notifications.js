import { Router } from 'express';

import middleware from '../middleware';
import { notifications as controller } from '../controllers';

const router = new Router();
const { auth } = middleware;

router.get('/', auth.authenticateUser, controller.get);
router.put('/:notificationId', controller.update);

export default router;
