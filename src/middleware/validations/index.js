import auth from './auth';
import contents from './contents';
import opportunities from './opportunities';
import tags from './tags';
import locations from './locations';
import occupations from './occupations';
import users from './users';

import models from '../../models';

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

/**
 * Verifies the included tags are all minor tags
 *
 * @param {Array} minorTags -
 *
 * @returns {void}
 * @memberOf Validate
 */
export const verifyTags = async (minorTags) => {
  for (let i = 0; i < minorTags.length; i += 1) {
    const tagId = minorTags[i];
    /* eslint-disable no-await-in-loop */
    const tag = await models.tag.findById(tagId);
    if (!tag) {
      throw new Error('One of the specified minor tags does not exist');
    }
    if (!tag.categoryId) {
      throw new Error('Opportunities can only be created with minor tags');
    }
  }
};
