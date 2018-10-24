import Validator from 'validatorjs';
import { getErrors } from '.';
import models from '../models';

const createMajorTagRules = {
  title: 'required|string'
};

const createMinorTagRules = {
  ...createMajorTagRules,
  categoryId: 'string|required'
};

/**
 * Holds validations for working with tags
 *
 * @class Validations
 */
class Validations {
  /**
   * Validates major tag creation data
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   * @param {Object} next - Express Next object
   *
   * @returns {void}
   * @memberOf Validations
   */
  createMajorTag = (req, res, next) => {
    const validation = new Validator(req.body, createMajorTagRules);
    validation.fails(() =>
      res.sendFailure(getErrors(validation, createMajorTagRules)));
    validation.passes(() => next());
  }

  /**
   * Validates major tag creation data
   *
   * @param {Object} req - Express Request object
   * @param {Object} res -  Express Response object
   * @param {Object} next - Express Next object
   *
   * @returns {void}
   * @memberOf Validations
   */
  createMinorTag = async (req, res, next) => {
    const validation = new Validator(req.body, createMinorTagRules);
    validation.fails(() =>
      res.sendFailure(getErrors(validation, createMinorTagRules)));
    const tag = await models.tag.findByPk(req.body.categoryId);
    if (!tag) {
      return res.sendFailure(['Specified tag does not exist']);
    }
    if (tag.categoryId) {
      return res.sendFailure(['Invalid major tag specified']);
    }
    validation.passes(() => next());
  }
}

export default new Validations();
