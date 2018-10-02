import { Router } from 'express';
import middleware from '../middleware';

import { misc as controller } from '../controllers';
import bannerAds from './banner_ads';

const { auth, check } = middleware;

const router = new Router();

router.get('/settings/backgrounds', controller.getBackgrounds);
router.use('/settings/banner-ads', bannerAds);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.get('/admin/logs', controller.getAdminLogs);
router.post('/settings/backgrounds', controller.setBackgrounds);
export default router;
