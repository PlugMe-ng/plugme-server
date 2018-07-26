/**
 * @fileOverview auth routes
 *
 * @author Franklin Chieze
 *
 * @requires NPM:express
 * @requires ../controllers/Auth
 * @requires ../middleware
 */

import { Router } from 'express';

import Auth from '../controllers/Auth';
import middleware from '../middleware';

const authController = new Auth();
const routes = new Router();

routes.post(
  '/signin',
  middleware.validate.signinUser,
  authController.signin
);

routes.post(
  '/signup',
  middleware.validate.signupUser,
  authController.signup
);

routes.post(
  '/social',
  middleware.validate.tokenSignIn,
  authController.tokenAuth
);

routes.put(
  '/verify-email',
  middleware.validate.emailVerification,
  authController.emailVerification
);

routes.post(
  '/verify-email',
  middleware.validate.emailAuthAction,
  authController.requestEmailVerification
);

routes.post(
  '/reset-password',
  middleware.validate.emailAuthAction,
  authController.requestPasswordReset
);

routes.put(
  '/reset-password',
  middleware.validate.passwordReset,
  authController.passwordReset
);

export default routes;
