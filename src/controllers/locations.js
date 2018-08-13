import models from '../models';
import helpers from '../helpers';

/**
 *
 *
 * @class Controller
 */
class Controller {
  /**
   * Gets all locations.
   * @param {Object} req - express request object
   * @param {Object} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  getAllLocations = async (req, res) => {
    try {
      const locations = await models.country.findAll({
        attributes: ['id', 'name'],
        include: [{
          model: models.location,
          attributes: ['id', 'name']
        }]
      });
      return res.sendSuccess(locations);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles creating a location.
   * @param {Object} req - express request object
   * @param {Object} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  addLocation = async (req, res) => {
    try {
      const location = await models.location.create(req.body);
      return res.sendSuccess(location);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles creating a country.
   * @param {Object} req - express request object
   * @param {Object} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  addCountry = async (req, res) => {
    try {
      const country = await models.country.create(req.body);
      return res.sendSuccess(country);
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }
}

export default new Controller();
