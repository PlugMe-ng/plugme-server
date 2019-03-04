/**
 * @fileOverview Validate middleware
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';

import { getErrors } from './';
import models from '../models';

const opportunityUploadRules = {
  title: 'required|string|max:36',
  locationId: 'required|string',
  positionNeeded: 'required|string|max:90',
  responsibilities: 'required|string|max:900',
  professionalDirection: 'required|string|max:200',
  tags: 'array|required|max:3',
  budget: 'required|numeric',
  deadline: 'required|date',
  allowedplans: 'array|in:basic,professional,business'
};

const opportunityReviewRules = {
  comment: 'required|string|max:60',
  rating: 'required|integer|between:1,5'
};

/**
* Middleware for validations
* @class Validate
*/
class Validate {
  /**
  * Validates opportunity creation data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async createOpportunity(req, res, next) {
    const validation = new Validator(req.body, opportunityUploadRules);
    validation.fails(() => {
      const errors = getErrors(validation, opportunityUploadRules);
      return res.sendFailure(errors);
    });
    const now = Date.now();
    if (new Date(req.body.deadline).getTime() < now) {
      return res.sendFailure([`Invalid deadline - date must be after ${new Date(now).toDateString()}`]);
    }
    // validatorjs does not work for empty array, cause for this manual validation
    if (req.body.allowedplans && req.body.allowedplans.length < 1) {
      return res.sendFailure(['allowedplans cannot be empty']);
    }
    validation.passes(() => next());
  }

  /**
   * Verifies the included tags are all minor tags
   *
   * @param {any} req - Express request object
   * @param {any} res - Express response object
   * @param {any} next - Express nexr object
   *
   * @returns {void}
   * @memberOf Validate
   */
  async verifyTags(req, res, next) {
    try {
      const includesMajorTag = !!(await models.tag.findOne({
        where: {
          id: req.body.tags,
          categoryId: null
        }
      }));
      if (includesMajorTag) {
        throw new Error('Opportunities can only be created with minor tags');
      }
      return next();
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Validates opportunity creation data
   * @param {any} req - express request object
   * @param {any} res - express response object
   * @param {any} next - express next object
   *
   * @returns {void}
   * @memberOf Validate
   */
  async reviewOpportunity(req, res, next) {
    const validation = new Validator(req.body, opportunityReviewRules);
    validation.fails(() => {
      const errors = getErrors(validation, opportunityReviewRules);
      return res.sendFailure(errors);
    });
    validation.passes(() => next());
  }
}

export default new Validate();
