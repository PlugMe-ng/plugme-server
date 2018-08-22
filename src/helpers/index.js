/**
 * @fileOverview helper functions
 *
 * @author Franklin Chieze
 *
 * @requires NODE:querystring
 * @requires NODE:url
 * @requires ../models
 */

import querystring from 'querystring';
import url from 'url';
import indefinite from 'indefinite';

import models from '../models';

/**
 * @method generatePaginationMeta
 * @desc Return pagination meta
 *
 * @param { object } req the request object
 * @param { Array } dbResult the query results from the database
 * @param {number} limit the number of items on a page
 * @param {number} offset the number of items to be skipped from the
 * beginning of the array of database results
 *
 * @returns { object } the output user object
 */
function generatePaginationMeta(req, dbResult, limit = 20, offset = 0) {
  limit = Number(limit) || 20;
  offset = Number(offset) || 0;

  // limit cannot be less than 1
  if (limit < 1) {
    limit = 1;
  }
  // offset cannot be less than 0
  if (offset < 0) {
    offset = 0;
  }

  const protocol =
  (req.secure || req.connection.encrypted) ? 'https:' : 'http:';
  const urlObject = url.parse(req.fullUrl);
  const endpointWithoutSearch =
  `${protocol}//${urlObject.host}${urlObject.pathname}`;
  const query = querystring.parse(urlObject.query || '');

  const paginationMeta = {
    limit,
    offset,
    page: Math.floor(offset / limit) + 1, // current page
    pages: Math.ceil(dbResult.count / limit), // total number of pages
    pageSize: limit, // number of items per page
    total: dbResult.count // total number of items
  };

  // current endpoint
  paginationMeta.current = req.fullUrl;

  // calculate next
  const nextOffset = offset + limit;
  if (nextOffset < dbResult.count) {
    if (query['@page']) {
      query['@page'] = paginationMeta.page + 1;
    } else {
      query['@offset'] = nextOffset;
    }
    paginationMeta.next =
    `${endpointWithoutSearch}?${querystring.stringify(query)}`
      .replace('%40limit=', '@limit=')
      .replace('%40page=', '@page=')
      .replace('%40offset=', '@offset=')
      .replace('%40order=', '@order=')
      .replace('%40search=', '@search=')
      .replace('%40sort=', '@sort=');
  }
  // calculate previous
  const prevOffset = offset - limit;
  if (prevOffset > -1) {
    if (query['@page']) {
      query['@page'] = paginationMeta.page - 1;
    } else {
      query['@offset'] = prevOffset;
    }
    paginationMeta.previous =
    `${endpointWithoutSearch}?${querystring.stringify(query)}`
      .replace('%40limit=', '@limit=')
      .replace('%40page=', '@page=')
      .replace('%40offset=', '@offset=')
      .replace('%40order=', '@order=')
      .replace('%40search=', '@search=')
      .replace('%40sort=', '@sort=');
  }

  return paginationMeta;
}

/**
 * @method updateUserAttributes
 * @desc Return updated user details
 *
 * @param { object } user the input user object
 *
 * @returns { object } the output user object
 */
function updateUserAttributes(user) {
  user = user.get();
  delete user.password;
  return user;
}

const enhanceErrorMessage = (error) => {
  if (error instanceof models.sequelize.UniqueConstraintError) {
    return `${error.parent.detail}`;
  }
  return error.message;
};

const isAdmin = user => user && user.role === 'admin';

/**
 * Logs admin actions.
 *
 * @param {any} req - Enhanced express request object
 * @param {Object} actionObject - Sequelize model instance on which action
 * is performed
 *
 * @returns {void}
 */
const logAdminAction = (req, actionObject) => {
  try {
    const actionEntityName = actionObject.constructor.name.toLowerCase();
    actionObject = actionObject.get();
    delete actionObject.password;

    const meta = {
      url: req.baseUrl,
      fullUrl: req.originalUrl,
      method: req.method,
      details: actionObject
    };

    let action;
    switch (req.method) {
      case 'POST':
        action = `created ${actionEntityName}`;
        break;
      case 'DELETE':
        action = `deleted ${actionEntityName}`;
        break;
      case 'PUT':
        action = `modified ${actionEntityName}`;
        break;
      default:
        break;
    }
    models.adminAction.create({
      userId: req.user.id,
      action,
      meta
    });
  } catch (error) {
    // no action
  }
};

export default {
  Misc: {
    generatePaginationMeta,
    updateUserAttributes,
    enhanceErrorMessage,
    isAdmin,
    logAdminAction
  }
};
