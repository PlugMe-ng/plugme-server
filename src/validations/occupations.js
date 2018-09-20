import Validator from 'validatorjs';
import { getErrors } from '.';

const addOccupationRules = {
  title: 'required|string'
};

/**
 * Holds validations for working with tags
 *
 * @class Validations
 */
class Validations {
  /**
   * Validates country addition data
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   * @param {Object} next - Express Next object
   *
   * @returns {void}
   * @memberOf Validations
   */
  addOccupation = (req, res, next) => {
    const validation = new Validator(req.body, addOccupationRules);
    validation.fails(() =>
      res.sendFailure(getErrors(validation, addOccupationRules)));
    validation.passes(() => next());
  }
}

export default new Validations();
