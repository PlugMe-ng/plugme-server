import config from '../config';

export const events = {
  LIKE: 'like',
  COMMENT: 'comment',
  OPPORTUNITY_APPLICATION: 'opportunity_application',
  OPPORTUNITY_ACHIEVER_SET: 'opportunity_achiever_set',
  OPPORTUNITY_ACHIEVER_SET_OTHERS: 'opportunity_achiever_set_others',
  OPPORTUNITY_REVIEW: 'opportunity_review',
  NEW_FAN: 'new_fan',
  NEW_CONTENT: 'new_content',
  CONTENT_DELETE: 'content_delete',
  OPPORTUNITY_DELETE: 'opportunity_delete',
  NEW_OPPORTUNITY: 'new_opportunity',
  SUBSCRIPTION_END: 'subscription_end',
  REJECTED_VERIFICATION_REQUEST: 'rejected_verification_request',
  APPROVED_VERIFICATION_REQUEST: 'approved_verification_request',
  OPPORTUNITY_DEADLINE_PASSED_NO_ACHIEVER_SET: 'opportunity_deadline_passed_no_achiever_set',
  OPPORTUNITY_DEADLINE_PASSED_NO_PLUGS: 'opportunity_deadline_passed_no_plugs',
  NEW_INBOX_MSG: 'new_inbox_msg'
};

export const eventDescriptions = {
  [events.LIKE]: 'liked your content',
  [events.COMMENT]: 'commented on your content',
  [events.OPPORTUNITY_APPLICATION]: 'has plugged to an opportunity you uploaded',
  [events.OPPORTUNITY_ACHIEVER_SET]: 'has plugged you to an opportunity',
  [events.OPPORTUNITY_ACHIEVER_SET_OTHERS]: 'You were not plugged to this opportunity',
  [events.OPPORTUNITY_REVIEW]: 'has reviewed your opportunity',
  [events.NEW_FAN]: 'is now a fan of yours',
  [events.NEW_CONTENT]: 'has published a new content',
  [events.NEW_OPPORTUNITY]: 'has uploaded a new opportuntity',
  [events.CONTENT_DELETE]: 'Content deleted by admin',
  [events.OPPORTUNITY_DELETE]: 'Opportunity deleted by admin',
  [events.SUBSCRIPTION_END]: 'Your subscription will expire in 5 days, please renew your subscription',
  [events.REJECTED_VERIFICATION_REQUEST]: 'Unfortunately, your portfolio verification request was declined. Please check your email for more information.',
  [events.APPROVED_VERIFICATION_REQUEST]: 'Congratulations, your portfolio has been permanently verified.',
  [events.OPPORTUNITY_DEADLINE_PASSED_NO_ACHIEVER_SET]: 'Your uploaded job deadline has passed with no achiever selected',
  [events.OPPORTUNITY_DEADLINE_PASSED_NO_PLUGS]: 'Your uploaded job deadline has passed with no plug entries'
};

export const templateIds = {
  [events.OPPORTUNITY_ACHIEVER_SET]: 'd-be38a16538034927b1d36de77437acd6',
  [events.OPPORTUNITY_ACHIEVER_SET_OTHERS]: 'd-3e34222d905f4ca5a4a0083e53702c54',
  [events.NEW_OPPORTUNITY]: 'd-f3626fd10a5c41d39615b102fa08c7a0',
  [events.SUBSCRIPTION_END]: 'd-6c2e66010d8944f082b15b511501f165',
  [events.NEW_FAN]: 'd-fa2d4cfaa23b42dc97136b6f095e189e',
  [events.LIKE]: 'd-3e19e4763d6045acb98f263cdab96177',
  [events.COMMENT]: 'd-530910ae20b441ad8915a21e4658cdcd',
  [events.NEW_CONTENT]: 'd-2efe463bcd6c4272868d2958e4f11b36',
  [events.OPPORTUNITY_APPLICATION]: 'd-4e0f5c6b9dba48c394ed637293f1034e',
  [events.REJECTED_VERIFICATION_REQUEST]: 'd-2b3f0bf59ed148499f7b9d6abfb52a5a',
  [events.APPROVED_VERIFICATION_REQUEST]: 'd-22f7a5c909124a868245c54ade1fef14',
  [events.OPPORTUNITY_DEADLINE_PASSED_NO_ACHIEVER_SET]: 'd-2e3e8d333ec843a8b24d627a7190d2bc',
  [events.OPPORTUNITY_DEADLINE_PASSED_NO_PLUGS]: 'd-d000080592d64bff9b1957c9439766a2',
  EMAIL_VERIFICATION: 'd-80aa362028504dffa50fcd7cfd17d617',
  PASSWORD_RESET: 'd-755be4a5d84d42379f040f7479562cf2',
  [events.NEW_INBOX_MSG]: 'd-31b628b8bc8d4fa1b09ce4625efb1ecd'
};

/**
 * Generates the required payload for sending an email notification based on the specified event
 * @param {Object} payload
 * @param {Object} payload.author - triggerer of the event
 * @param {string} payload.event - type of event triggered
 * @param {Object} payload.recipient - an object specifying the recipients details
 * email address and fullName
 * @param {Object} payload.entity - action object
 *
 * @returns {void}
 */
export const generateNotifMailPayload = ({
  event, author, entity, recipient
}) => {
  const data = generateMailData({ event, author, recipient, entity }); // eslint-disable-line

  return {
    data,
    address: recipient.email,
    templateId: templateIds[event],
    // this equal the notifications unsubscribe groupId from sendgrid dashboard
    unsubscribeGroupId: 8034
  };
};

const generateMailData = ({
  event, recipient, author, entity
}) => {
  let data = {};
  switch (event) {
    case events.OPPORTUNITY_ACHIEVER_SET:
    case events.OPPORTUNITY_ACHIEVER_SET_OTHERS:
    case events.NEW_OPPORTUNITY:
    case events.OPPORTUNITY_APPLICATION:
      data = {
        fullName: recipient.fullName,
        link: `${config.FE_URL}/opportunity/${author.username}/${entity.id}`
      };
      break;
    case events.SUBSCRIPTION_END:
      data = {
        fullName: recipient.fullName,
        link: `${config.FE_URL}/subscribe`
      };
      break;
    case events.NEW_FAN:
      data = {
        fanFullName: author.fullName,
        link: `${config.FE_URL}/notification`
      };
      break;
    case events.LIKE:
    case events.COMMENT:
    case events.NEW_CONTENT:
      data = {
        authorFullName: author.fullName,
        link: `${config.FE_URL}/content/${entity.id}`
      };
      break;
    case events.REJECTED_VERIFICATION_REQUEST:
      data = {
        fullName: recipient.fullName,
        comment: entity.comment
      };
      break;
    case events.APPROVED_VERIFICATION_REQUEST:
      data = {
        fullName: recipient.fullName
      };
      break;
    case events.NEW_INBOX_MSG:
      data = {
        link: `${config.FE_URL}/inbox`
      };
      break;
    default:
      break;
  }
  return data;
};
