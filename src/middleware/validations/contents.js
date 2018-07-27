/**
 * @fileOverview Validate middleware
 *
 * @author Franklin Chieze
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';

const contentCreationRules = {
  title: 'required|string',
  description: 'required|string',
  mediaUrls: 'array',
  tags: 'array|required',
  mediaType: 'required_with:mediaUrls|in:video,image'
};

const addCommentRules = {
  text: 'required|string|max:90'
};

/**
* Middleware for validations
* @class Validate
*/
class Validate {
  /**
  * validates content creation data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async createContent(req, res, next) {
    const validation = new Validator(req.body, contentCreationRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('title'),
      ...validation.errors.get('description'),
      ...validation.errors.get('mediaUrls'),
      ...validation.errors.get('tags'),
      ...validation.errors.get('mediaType')
    ]));
    validation.passes(() => next());
  }

  /**
  * validates content creation data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async addComment(req, res, next) {
    const validation = new Validator(req.body, addCommentRules);
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('text'),
    ]));
    validation.passes(() => next());
  }
}

export default new Validate();
