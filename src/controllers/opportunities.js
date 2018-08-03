import models from '../models';

/**
 * @class Controller
 */
class Controller {
  /**
   * Handles creating a new opportunity
   *
   * @param {Express.Request} req - express request object
   * @param {Express.Response} res - express response object
   *
   * @returns {void}
   * @memberOf Controller
   */
  createOpportunity = async (req, res) => {
    let opportunity;
    try {
      const { tags, locationId } = req.body;
      const { userObj } = req;

      opportunity = await models.opportunity.create(req.body);
      await opportunity.setTags(tags);
      await opportunity.setLocation(locationId);
      await opportunity.setPlugger(userObj);

      opportunity = await models.opportunity.findById(opportunity.id, {
        include: [{
          model: models.location,
          attributes: ['id', 'name'],
          include: [{
            model: models.country,
            attributes: ['id', 'name']
          }]
        }, {
          model: models.User,
          attributes: ['id', 'username', 'fullName'],
          as: 'plugger'
        }, {
          model: models.tag,
          as: 'tags',
          attributes: ['id', 'title'],
          through: {
            attributes: []
          }
        }]
      });
      await res.sendSuccess(opportunity);
    } catch (error) {
      if (opportunity) {
        await opportunity.destroy();
      }
      return res.sendFailure([error.message]);
    }
  }
}

export default new Controller();
