/**
 * @fileOverview Validate middleware
 *
 * @author Idris Adetunmbi
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';
import models from '../../models';

const opportunityUploadRules = {
  title: 'required|string|max:200',
  locationId: 'required|string',
  positionNeeded: 'required|string|max:90',
  responsibilities: 'required|string|max:360',
  professionalDirection: 'required|string|max:200',
  tags: 'array|required|max:3',
  budget: 'required|numeric',
  deadline: 'required|date'
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
      let errors = [];
      Object.keys(opportunityUploadRules).forEach((key) => {
        errors = [...errors, ...validation.errors.get(key)];
      });
      return res.sendFailure(errors);
    });
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
    for (let i = 0; i < req.body.tags.length; i += 1) {
      try {
        const tagId = req.body.tags[i];
        /* eslint-disable no-await-in-loop */
        const tag = await models.tag.findById(tagId);
        if (!tag) {
          throw new Error('One of the specified minor tags does not exist');
        }
        if (!tag.categoryId) {
          throw new Error('Opportunities can only be created with minor tags');
        }
      } catch (error) {
        res.sendFailure([error.message]);
        return;
      }
    }
    next();
  }
}

export default new Validate();
