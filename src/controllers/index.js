/**
 * @fileOverview index file for controllers
 *
 * @author Franklin Chieze
 *
 * @requires ./Auth
 * @requires ./Users
 */

import Auth from './Auth';
import Users from './Users';
import contents from './contents';
import tags from './tags';

export default {
  Auth,
  Users,
  contents,
  tags
};
