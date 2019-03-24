import models from '../../models';
import notifications from '../notifications';
import { opportunitiesSearchIndex as searchIndex } from '../../search_indexing';
import { events } from '../../helpers';

export default async (req, res) => {
  try {
    const opportunity = await models.opportunity.findByPk(req.params.opportunityId);
    if (!opportunity) throw new Error('Specified job does not exist');

    opportunity.destroy();

    notifications.create({
      author: req.userObj,
      event: events.OPPORTUNITY_DELETE,
      recipients: [opportunity.pluggerId],
      entity: opportunity
    });
    searchIndex.deleteRecord(opportunity.id);
    return res.sendSuccessAndLog(opportunity, { message: 'Job deleted successfully' });
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};
