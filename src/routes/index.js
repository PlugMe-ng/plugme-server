/**
 * @fileOverview Application's routes
 *
 * @author Franklin Chieze
 *
 * @requires ./auth
 * @requires ./users
 */
import { Router } from 'express';

import authRoutes from './auth';
import usersRoutes from './users';
import contentRoutes from './contents';
import tagRoutes from './tags';
import opportunitiesRoutes from './opportunities';
import locationRoutes from './locations';
import occupationRoutes from './occupations';
import miscRoutes from './misc';
import notificationRoutes from './notifications';

const router = new Router();

router
  .use('/auth', authRoutes)
  .use('/users', usersRoutes)
  .use('/gallery', contentRoutes)
  .use('/tags', tagRoutes)
  .use('/opportunities', opportunitiesRoutes)
  .use('/locations', locationRoutes)
  .use('/occupations', occupationRoutes)
  .use('/notifications', notificationRoutes)
  .use('/', miscRoutes);

export default router;
