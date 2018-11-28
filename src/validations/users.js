import Validator from 'validatorjs';
import { getErrors } from '.';

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
}

export default new Validations();
