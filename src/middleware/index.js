/**
 * @fileOverview index file for middleware
 *
 * @author Franklin Chieze
 *
 * @requires ./api
 * @requires ./Auth
 * @requires ./Confirmation
 * @requires ./pagination
 * @requires ./Validation
 */

import api from './api';
import Auth from './Auth';
import Check from './Check';
import meta from './meta';

const auth = new Auth();
const check = new Check();

export default {
  api,
  auth,
  check,
  meta
};
