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
    const { attribute, order } = req.meta.sort;

    try {
      const locations = await models.country.findAll({
        order: [[attribute, order]],
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
      return res.sendSuccessAndLog(location);
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
      return res.sendSuccessAndLog(country);
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }

  /**
   * Handles deleting a location.
   * @param {Object} req - express request object
   * @param {Object} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  deleteLocation = async (req, res) => {
    try {
      const location = await models.location.findById(req.params.locationId);
      if (!location) {
        throw new Error('Specified location does not exist');
      }
      location.destroy();
      return res.sendSuccessAndLog(location, { message: 'Location deleted successfully' });
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }

  /**
   * Handles deleting a country.
   * @param {Object} req - express request object
   * @param {Object} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  deleteCountry = async (req, res) => {
    try {
      const country = await models.country.findById(req.params.countryId);
      if (!country) {
        throw new Error('Specified country does not exist');
      }
      country.destroy();
      return res.sendSuccessAndLog(country, { message: 'Country deleted successfully' });
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }
}

export default new Controller();
