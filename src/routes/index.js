/**
 * @fileOverview Application's routes
 *
 * @author Franklin Chieze
 *
 * @requires ./auth
 * @requires ./users
 */
import { Router } from 'express';

import auth from './auth';
import users from './users';
import contents from './contents';
import tags from './tags';
import opportunities from './opportunities';
import locations from './locations';
import occupations from './occupations';
import misc from './misc';
import notifications from './notifications';
import gallery from './gallery';

const router = new Router();

router
  .use('/auth', auth)
  .use('/users', users)
  .use('/contents', contents)
  .use('/gallery', gallery)
  .use('/tags', tags)
  .use('/opportunities', opportunities)
  .use('/locations', locations)
  .use('/occupations', occupations)
  .use('/notifications', notifications)
  .use('/', misc);

export default router;
