import { Router } from 'express';
import middleware from '../middleware';

import { misc as controller } from '../controllers';
import bannerAds from './banner_ads';

const { auth, check } = middleware;

const router = new Router();

router.get('/settings/backgrounds', controller.getBackgrounds);
router.post('/payment-webhooks', controller.handleUserSubscription);
router.use('/settings/banner-ads', bannerAds);
router.post('/newsletter/subscriptions', controller.subscribeNewsletterRecipient);

router.use(auth.authenticateUser, check.currentUserIsAdmin);

router.get('/admin/logs', controller.getAdminLogs);
router.post('/settings/backgrounds', controller.setBackgrounds);

router.get('/settings/professional-directions', controller.getProfessionalDirections);
router.post('/settings/professional-directions', controller.addProfessionalDirection);
router.delete('/settings/professional-directions/:title', controller.deleteProfessionalDirection);
router.put('/settings/professional-directions/:title', controller.editProfessionalDirection);

export default router;
