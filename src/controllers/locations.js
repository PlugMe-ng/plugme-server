import models from '../models';

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
}

export default new Controller();
