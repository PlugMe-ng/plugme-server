import { Router } from 'express';

import { auth as validations } from '../validations';
import { auth as controller } from '../controllers';

const routes = new Router();

routes.post(
  '/signin',
  validations.signinUser,
  controller.signin
);

routes.post(
  '/signup',
  validations.signupUser,
  controller.signup
);

routes.post(
  '/social',
  validations.tokenSignIn,
  controller.tokenAuth
);

routes.put(
  '/verify-email',
  validations.emailVerification,
  controller.emailVerification
);

routes.post(
  '/verify-email',
  validations.emailAuthAction,
  controller.requestEmailVerification
);

routes.post(
  '/reset-password',
  validations.emailAuthAction,
  controller.requestPasswordReset
);

routes.put(
  '/reset-password',
  validations.passwordReset,
  controller.passwordReset
);

export default routes;
