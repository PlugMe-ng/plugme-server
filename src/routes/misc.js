import { Router } from 'express';
import middleware from '../middleware';

import { misc as controller } from '../controllers';

const { auth, check } = middleware;

const router = new Router();

router.get(
  '/admin/logs',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  controller.getAdminLogs
);

router.get(
  '/tags/stats',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  controller.tagStats
);

export default router;
