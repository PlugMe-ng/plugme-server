/**
 * @fileOverview users routes
 *
 * @author Franklin Chieze
 *
 * @requires NPM:express
 * @requires ../controllers/Users
 * @requires ../middleware
 */

import { Router } from 'express';

import middleware from '../middleware';
import controllers from '../controllers';

const router = new Router();
const { pagination, sort, auth: { authenticateUser } } = middleware;
const { gallery: controller } = controllers;

router.get('/', authenticateUser, pagination, sort, controller.getUserGallery);
router.get('/tags', controller.galleryTags);
router.get('/tags/minor', controller.galleryTagsMinor);
router.get('/tags/:categoryId', controller.galleryTagsMinor);
router.get('/trending', controller.trendingTags);

export default router;
