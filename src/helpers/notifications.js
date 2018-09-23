import config from '../config';

export const events = {
  LIKE: 'like',
  COMMENT: 'comment',
  OPPORTUNITY_APPLICATION: 'opportunity_application',
  OPPORTUNITY_ACHIEVER_SET: 'opportunity_achiever_set',
  OPPORTUNITY_ACHIEVER_SET_OTHERS: 'opportunity_achiever_set_others',
  OPPORTUNITY_REVIEW: 'opportunity_review',
  NEW_MESSAGE: 'new_message',
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
  new_message: 'messaged you',
  new_fan: 'is now a fan of yours',
  new_content: 'has published a new content',
  new_opportunity: 'has uploaded a new opportuntity',
  content_delete: 'Content deleted by admin',
  opportunity_delete: 'Opportunity deleted by admin',
  subscription_end: 'Your subscription will expire in 5 days, please renew your subscription'
};

export const generateEventMailPayload = {
  opportunity_achiever_set: (author, recipient, entity) => ({
    subject: 'You have been plugged to an opportunity',
    content:
      `
      <p>Hi ${recipient.fullName},</p>

      <p>You have been PLUGGED to this <a href="${config.FE_URL}/opportunity/${author.username}/${entity.id}">opportunity</a> and will be duly contacted by the Plugger for further information</p>
      `,
    address: recipient.email
  }),

  opportunity_achiever_set_others: (author, recipient, entity) => ({
    subject: 'You were not plugged to an opportunity',
    content:
      `
      <p>Hi ${recipient.fullName}</p>

      <p>Unfortunately, you were not plugged to this <a href="${config.FE_URL}/${author.username}/opportunity/${entity.id}">opportunity</a></p>

      <p>There are more opportunities waiting for you on <a href="${config.FE_URL}">PlugMe</a> however</p>
      `,
    address: recipient.email
  }),

  new_opportunity: (author, recipient, entity) => ({
    subject: 'New opportunity is available',
    content:
    `
    <p>Hi ${recipient.fullName}</p>

    <p>A new <a href="${config.FE_URL}/${author.username}/opportunity/${entity.id}">opportunity</a> that match your skills tag has been uploaded.</p>

    <p>Hurry now to apply for this opportuntiy before it passes.</p>
    `,
    address: recipient.email
  }),

  subscription_end: (author, recipient, entity) => ({
    subject: 'Your current subscription will expire in 5 days',
    content:
    `
    <p>Hi ${recipient.fullName}</p>

    <p>Your current subscription plan will expire in 5 days, after which you will no longer be able to upload contents or get plugged to new opportunities</p>

    <p>Please renew or upgrade your plan as soon as possible</p>
    `,
    address: recipient.email
  })
};
