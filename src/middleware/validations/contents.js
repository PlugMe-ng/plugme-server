/**
 * @fileOverview Validate middleware
 *
 * @author Franklin Chieze
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';
import models from '../../models';

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

  /**
  * validates content flagging data
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async flagContent(req, res, next) {
    const validation = new Validator(req.body, {
      info: 'required|string'
    });
    validation.fails(() => res.sendFailure([
      ...validation.errors.get('info'),
    ]));
    validation.passes(() => next());
  }

  /**
  * validates if a content exists
  * @param {object} req express request object
  * @param {object} res express response object
  * @param {object} next the next middleware or controller
  *
  * @returns {any} the next middleware or controller
  */
  async contentExists(req, res, next) {
    const { contentId } = req.params;
    let content;
    try {
      content = await models.content.findById(contentId);
    } catch (error) {
      return res.sendFailure([`Invalid contentId - ${error.message}`]);
    }
    if (!content) {
      return res.sendFailure(['Specified content does not exist']);
    }
    req.content = content;
    return next();
  }
}

export default new Validate();
