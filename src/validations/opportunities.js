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
import { cache } from '../helpers';

const opportunityUploadRules = {
  title: 'required|string|max:36',
  responsibilities: 'required|string|max:900',
  professionalDirection: 'required|string|in_professional_directions',
  tags: 'array|required|max:3',
  budget: 'required|numeric',
  deadline: 'required|date',
  allowedplans: 'array|in:basic,professional,business',
  type: 'string|in_opportunity_types'
};

const opportunityReviewRules = {
  comment: 'required|string|max:60',
  rating: 'required|integer|between:1,5'
};

Validator.registerAsync(
  'in_professional_directions',
  async (professionalDirection, attribute, req, passes) => {
    const isInProfessionalDirections =
      (await cache.sismember('professional_directions', professionalDirection)) === 1;
    if (!isInProfessionalDirections) {
      passes(false, 'Specified professionalDirection is invalid');
      return;
    }
    passes();
  }
);

Validator.registerAsync(
  'in_opportunity_types',
  async (type, attribute, req, passes) => {
    const isInOpportunityTypes =
      (await cache.sismember('opportunity_types', type)) === 1;
    if (!isInOpportunityTypes) {
      passes(false, 'Specified opportunity type is invalid');
      return;
    }
    passes();
  }
);

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
    validation.passes(() => {
      const now = Date.now();
      if (new Date(req.body.deadline).getTime() < now) {
        return res.sendFailure([`Invalid deadline - date must be after ${new Date(now).toDateString()}`]);
      }
      // validatorjs does not work for empty array, cause for this manual validation
      if (req.body.allowedplans && req.body.allowedplans.length < 1) {
        return res.sendFailure(['allowedplans cannot be empty']);
      }
      return next();
    });
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

export { Validator };
export default new Validate();
