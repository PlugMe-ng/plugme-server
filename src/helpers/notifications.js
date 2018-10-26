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
  SUBSCRIPTION_END: 'subscription_end'
};

export const eventDescriptions = {
  like: 'liked your content',
  comment: 'commented on your content',
  opportunity_application: 'has plugged to an opportunity you uploaded',
  opportunity_achiever_set: 'has plugged you to an opportunity',
  opportunity_achiever_set_others: 'You were not plugged to this opportunity',
  opportunity_review: 'has reviewed your opportunity',
  new_fan: 'is now a fan of yours',
  new_content: 'has published a new content',
  new_opportunity: 'has uploaded a new opportuntity',
  content_delete: 'Content deleted by admin',
  opportunity_delete: 'Opportunity deleted by admin',
  subscription_end: 'Your subscription will expire in 5 days, please renew your subscription'
};

export const generateEventMailPayload = {
  opportunity_achiever_set: (author, recipient, entity) => ({
    address: recipient.email,
    data: {
      fullName: recipient.fullName,
      link: `${config.FE_URL}/opportunity/${author.username}/${entity.id}`
    },
    templateId: 'd-be38a16538034927b1d36de77437acd6'
  }),

  opportunity_achiever_set_others: (author, recipient, entity) => ({
    address: recipient.email,
    data: {
      fullName: recipient.fullName,
      link: `${config.FE_URL}/opportunity/${author.username}/${entity.id}`
    },
    templateId: 'd-3e34222d905f4ca5a4a0083e53702c54'
  }),

  new_opportunity: (author, recipient, entity) => ({
    address: recipient.email,
    templateId: 'd-f3626fd10a5c41d39615b102fa08c7a0',
    data: {
      fullName: recipient.fullName,
      link: `${config.FE_URL}/opportunity/${author.username}/${entity.id}`
    }
  }),

  subscription_end: (author, recipient, entity) => ({
    address: recipient.email,
    templateId: 'd-6c2e66010d8944f082b15b511501f165',
    data: {
      fullName: recipient.fullName,
      link: `${config.FE_URL}/subscribe`
    }
  })
};
