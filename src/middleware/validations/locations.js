import Validator from 'validatorjs';
import { getErrors } from '.';

const addCountryRules = {
  name: 'required|string'
};

const addLocationRules = {
  ...addCountryRules,
  countryId: 'string|required'
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
  addCountry = (req, res, next) => {
    const validation = new Validator(req.body, addCountryRules);
    validation.fails(() =>
      res.sendFailure(getErrors(validation, addCountryRules)));
    validation.passes(() => next());
  }

  /**
   * Validates location addition data
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   * @param {Object} next - Express Next object
   *
   * @returns {void}
   * @memberOf Validations
   */
  addLocation = async (req, res, next) => {
    const validation = new Validator(req.body, addLocationRules);
    validation.fails(() =>
      res.sendFailure(getErrors(validation, addLocationRules)));
    validation.passes(() => next());
  }
}

export default new Validations();
