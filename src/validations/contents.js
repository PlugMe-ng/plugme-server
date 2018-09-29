/**
 * @fileOverview Validate middleware
 *
 * @author Franklin Chieze
 *
 * @requires NPM:validatorjs
 */

import Validator from 'validatorjs';
import models from '../models';

const contentCreationRules = {
  title: 'required|string',
  description: 'required|string',
  mediaUrls: 'array',
  tags: 'array|required|max:3',
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

  /**
   * Checks if content tags contain at least one minor tag
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next the next middleware or controller
   *
   * @returns {any} the next middleware or controller
   * @memberOf Validate
   */
  checkMinorTagInclusion = async (req, res, next) => {
    const { tags } = req.body;
    try {
      for (let i = 0; i < tags.length; i += 1) {
        /* eslint-disable no-await-in-loop */
        const tag = await models.tag.findById(tags[i]);
        if (tag && tag.categoryId) {
          return next();
        }
      }
      throw new Error('Content must include at least one minor tag');
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Restricts the number of tags a user can upload contents with based on the user's current plan
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next the next middleware or controller
   *
   * @returns {any} the next middleware or controller
   * @memberOf Validate
   */
  userPlanLimit = (req, res, next) => {
    const { tags } = req.body;
    const userPlan = req.userObj.plan.type;

    try {
      switch (userPlan) {
        case 'basic':
          if (tags.length > 1) {
            throw new Error('Your plan supports uploading content with a minor tag only');
          }
          return next();
        case 'pro':
          if (tags.length > 2) {
            throw new Error('Your plan supports uploading content with two tags only');
          }
          return next();
        case 'premium':
          return next();
        default:
          break;
      }
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }
}

export default new Validate();