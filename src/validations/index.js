export { default as auth } from './auth';
export { default as contents } from './contents';
export { default as opportunities } from './opportunities';
export { default as tags } from './tags';
export { default as locations } from './locations';
export { default as occupations } from './occupations';
export { default as users } from './users';


export const getErrors = (validation, rules) => {
  let errors = [];
  Object.keys(rules).forEach((rule) => {
    errors = [...errors, ...validation.errors.get(rule)];
  });
  return errors;
};

