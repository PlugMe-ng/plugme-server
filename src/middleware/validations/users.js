import Validator from 'validatorjs';
import { getErrors } from '.';

const userUpdateRules = {
  role: 'in:member,admin',
  blocked: 'boolean'
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
  updateUser = (req, res, next) => {
    const validation = new Validator(req.body, userUpdateRules);
    validation.fails(() => res
      .sendFailure(getErrors(validation, userUpdateRules)));
    validation.passes(() => next());
  }
}

export default new Validations();
