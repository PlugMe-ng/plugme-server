import { Router } from 'express';
import middleware from '../middleware';

import { misc as controller } from '../controllers';

const {
  auth, check, filter, sort, search, pagination
} = middleware;

const router = new Router();

router.get(
  '/admin/logs',
  auth.authenticateUser,
  check.currentUserIsAdmin,
  pagination,
  sort,
  search,
  filter,
  controller.getAdminLogs
);

export default router;
