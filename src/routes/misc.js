import { Router } from 'express';
import middleware from '../middleware';
import misc from '../controllers/misc';

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
  misc.getAdminLogs
);

export default router;
