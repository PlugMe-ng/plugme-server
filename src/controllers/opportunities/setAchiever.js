/* eslint-disable no-use-before-define */
import { Op } from 'sequelize';

import models from '../../models';
import notifications from '../notifications';
import { events } from '../../helpers';

export default async (req, res) => {
  const { opportunityId, userId } = req.params;
  const { userObj: plugger } = req;

  try {
    const opportunity = await models.opportunity.findByPk(opportunityId);
    if (!opportunity) throw new Error('Specified job does not exist');
    if (opportunity.pluggerId !== plugger.id) {
      throw new Error('Specified job was uploaded by another user');
    }
    if (opportunity.achieverId) throw new Error('This job already has an achiever');
    if (!(await opportunity.hasPlugEntry(userId))) {
      throw new Error('Specified user did not apply for this job');
    }

    await opportunity.update({
      status: 'pending',
      achieverId: userId
    });

    notifyUnselectedAchievers(opportunity, plugger);

    return res.sendSuccessAndNotify({
      event: events.OPPORTUNITY_ACHIEVER_SET,
      recipients: [userId],
      entity: opportunity,
      includeEmail: true
    }, {
      message: 'Achiever plugged successfully'
    });
  } catch (error) {
    return res.sendFailure([error.message]);
  }
};

const notifyUnselectedAchievers = async (opportunity, author) => {
  const unselectedAchieversIds = (await opportunity.getPlugEntries({
    attributes: ['id'],
    joinTableAttributes: [],
    where: { id: { [Op.ne]: opportunity.achieverId } }
  })).map(user => user.id);

  notifications.create({
    author,
    event: events.OPPORTUNITY_ACHIEVER_SET_OTHERS,
    recipients: unselectedAchieversIds,
    entity: opportunity,
    includeEmail: true
  });
};
