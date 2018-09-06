import { Router } from 'express';
import middleware from '../middleware';
import notifications from '../controllers/notifications';

const router = new Router();

const { auth, pagination, sort } = middleware;

router.get(
  '/',
  pagination,
  sort,
  auth.authenticateUser,
  notifications.get
);

router.put('/:notificationId', notifications.update);

export default router;
