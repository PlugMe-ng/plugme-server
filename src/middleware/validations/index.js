import auth from './auth';
import contents from './contents';
import opportunities from './opportunities';
import tags from './tags';
import locations from './locations';

export default {
  auth,
  contents,
  opportunities,
  tags,
  locations
};

export const getErrors = (validation, rules) => {
  let errors = [];
  Object.keys(rules).forEach((rule) => {
    errors = [...errors, ...validation.errors.get(rule)];
  });
  return errors;
};
