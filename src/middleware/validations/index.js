import auth from './auth';
import contents from './contents';
import opportunities from './opportunities';
import tags from './tags';
import locations from './locations';
import occupations from './occupations';
import users from './users';

export default {
  auth,
  contents,
  opportunities,
  tags,
  locations,
  occupations,
  users
};

export const getErrors = (validation, rules) => {
  let errors = [];
  Object.keys(rules).forEach((rule) => {
    errors = [...errors, ...validation.errors.get(rule)];
  });
  return errors;
};
