/**
 * @fileOverview Application's routes
 *
 * @author Franklin Chieze
 *
 * @requires ./auth
 * @requires ./users
 */

import authRoutes from './auth';
import usersRoutes from './users';
import contentRoutes from './contents';
import tagRoutes from './tags';

export default (app) => {
  app.use('/v1/auth', authRoutes);

  app.use('/v1/users', usersRoutes);

  app.use('/v1/gallery', contentRoutes);

  app.use('/v1/tags', tagRoutes);
};
