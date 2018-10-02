import Validator from 'validatorjs';
import { getErrors } from '.';

import models from '../models';

const adminUserUpdateRules = {
  role: 'in:member,admin',
  blocked: 'boolean',
  profileModificationCount: 'numeric'
};

const userUpdateRules = {
  occupationId: 'string',
  locationId: 'string',
  username: 'alpha_dash|min:5|max:20',
  fullName: 'string|between:5,25',
  skills: 'array|min:1|max:3',
  interests: 'array|min:1',
  bio: 'string|max:270',
  experience: 'string|max:270',
  photo: 'url'
};

const minorTagsOnly = async (tags) => {
  for (let i = 0; i < tags.length; i += 1) {
    const tag = await models.tag.findById(tags[i]); // eslint-disable-line
    if (!tag || !tag.categoryId) return false;
  }
  return true;
};

/**
 * @class Validations
 */
class Validations {
  /**
   * Validates user update data
   *
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Objetc
   * @param {Function} next - Express Next Function
   *
   * @returns {void}
   * @memberOf Validations
   */
  adminUserUpdate = (req, res, next) => {
    const validation = new Validator(req.body, adminUserUpdateRules);
    validation.fails(() => res
      .sendFailure(getErrors(validation, adminUserUpdateRules)));
    validation.passes(() => next());
  }

  /**
   * Validates user update data
   *
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Objetc
   * @param {Function} next - Express Next Function
   *
   * @returns {void}
   * @memberOf Validations
   */
  userUpdate = async (req, res, next) => {
    const validation = new Validator(req.body, userUpdateRules);
    validation.fails(() => res
      .sendFailure(getErrors(validation, userUpdateRules)));
    validation.passes(() => next());
  }

  /**
   * Inlcudes required checks for user profile update
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response Objetc
   * @param {Function} next - Express Next Function
   *
   * @returns {void}
   * @memberOf Validations
   */
  userProfileUpdateChecks = async (req, res, next) => {
    try {
      if (req.body.skills && !(await minorTagsOnly(req.body.skills))) {
        throw new Error('Skills can only contain minor tags');
      }
      if (req.body.interests && req.userObj.plan.type === 'basic') {
        if (req.body.interests.length > 5 || !(await minorTagsOnly(req.body.interests))) {
          throw new Error('Maximum of 5 interest minor tags allowed for basic plan users');
        }
      }
      if ((req.body.occupationId || req.body.fullName || req.body.username) &&
        req.user.meta.profileModificationCount > 2) {
        const {
          occupationId, fullName, username, ...data
        } = req.body;
        req.body = data;
      }
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}

export default new Validations();
