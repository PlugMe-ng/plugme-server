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
import { auth as validations } from '../validations';

const authController = new Auth();
const routes = new Router();

routes.post(
  '/signin',
  validations.signinUser,
  authController.signin
);

routes.post(
  '/signup',
  validations.signupUser,
  authController.signup
);

routes.post(
  '/social',
  validations.tokenSignIn,
  authController.tokenAuth
);

routes.put(
  '/verify-email',
  validations.emailVerification,
  authController.emailVerification
);

routes.post(
  '/verify-email',
  validations.emailAuthAction,
  authController.requestEmailVerification
);

routes.post(
  '/reset-password',
  validations.emailAuthAction,
  authController.requestPasswordReset
);

routes.put(
  '/reset-password',
  validations.passwordReset,
  authController.passwordReset
);

export default routes;
