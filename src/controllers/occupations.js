import models from '../models';
import helpers from '../helpers';

/**
 * @class Controller
 */
class Controller {
  /**
   * Retrieves all occupations
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  get = async (req, res) => {
    const { attribute, order } = req.meta.sort;

    try {
      const occupations = await models.occupation.findAll({
        order: [[attribute, order]]
      });
      return res.sendSuccess(occupations);
    } catch (error) {
      return res.sendFailure([error.message]);
    }
  }

  /**
   * Handles occupation creation
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  addOccupation = async (req, res) => {
    try {
      const occupation = await models.occupation.create(req.body);
      return res.sendSuccess(occupation);
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }

  /**
   * Handles occupation deletion
   *
   * @param {Object} req - Express request object
   * @param {Object} res -  Express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  deleteOccupation = async (req, res) => {
    try {
      const occupation = await models.occupation
        .findById(req.params.occupationId);
      if (!occupation) {
        throw new Error('Specified occupation does not exist');
      }
      req.adminActionObject = occupation;
      occupation.destroy();
      return res.sendSuccess({ message: 'Occupation deleted successfully' });
    } catch (error) {
      return res.sendFailure([helpers.Misc.enhanceErrorMessage(error)]);
    }
  }
}

export default new Controller();
