import Validator from 'validatorjs';
import { getErrors } from '.';

import models from '../../models';

const adminUserUpdateRules = {
  role: 'in:member,admin',
  blocked: 'boolean'
};

const userUpdateRules = {
  occupationId: 'string',
  locationId: 'string',
  username: 'alpha_dash|min:5|max:20',
  fullName: 'string|between:5,25',
  skills: 'array|min:1',
  interests: 'array|min:1',
  bio: 'string|max:270',
  experience: 'string|max:270',
  photo: 'url'
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
    if (req.body.skills) {
      for (let i = 0; i < req.body.skills.length; i += 1) {
        try {
          const tagId = req.body.skills[i];
          /* eslint-disable no-await-in-loop */
          const tag = await models.tag.findById(tagId);
          if (!tag) {
            throw new Error('One of the specified minor tags does not exist');
          }
          if (!tag.categoryId) {
            throw new Error('Skills tag can only contain minor tags');
          }
        } catch (error) {
          return res.sendFailure([error.message]);
        }
      }
    }
    if (req.body.occupationId && req.user.meta.occupationModificationCount > 2) {
      const { occupationId, ...data } = req.body;
      req.body = data;
    }
    validation.passes(() => next());
  }
}

export default new Validations();
