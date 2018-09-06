import helpers from '../helpers';
import notifications from '../controllers/notifications';

/**
 * @fileOverview API middleware
 *
 * @author Franklin Chieze
 */

/**
 * @desc This middleware adds new methods for sending responses to the
 * response object (and full URL info to the request object)
 *
 * @param { object } req request
 * @param { object } res response
 * @param { object } next the next middleware or endpoint
 *
 * @returns { object } next
 */
export default (req, res, next) => {
  req.fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  req.fullUrlWithoutSearch = `${req.protocol}://${req.get('host')}${req.path}`;

  res.sendSuccess = (data, status = 200, meta) =>
    res.status(status).json({
      data,
      meta
    });

  res.sendSuccessAndLog = (actionObject, data = actionObject, status = 200, meta) => {
    helpers.Misc.logAdminAction(req, actionObject);
    return res.sendSuccess(data, status, meta);
  };

  /**
   * @param {Object} payload
   * @param {string} payload.event - type of event triggered
   * @param {Array.<string>} payload.recipients - an array of recipientIds of
   * the event
   * @param {Object} payload.entity - action object
   * @param {any} data
   * @param {number} [status=200]
   * @param {any} meta
   * @returns {void}
   */
  res.sendSuccessAndNotify = (payload, data, status = 200, meta) => {
    notifications.create(req.user, payload);
    return res.sendSuccess(data, status, meta);
  };

  res.sendFailure = (errors, status = 200, meta) =>
    res.status(status).json({
      errors,
      meta
    });

  return next();
};
