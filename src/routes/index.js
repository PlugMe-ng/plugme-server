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

export default (app) => {
  app.use('/v1/auth', authRoutes);

  app.use('/v1/users', usersRoutes);
};
