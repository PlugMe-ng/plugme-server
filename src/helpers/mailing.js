import sendGrid from '@sendgrid/mail';

sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

export default ({
  templateId, data, address, unsubscribeGroupId
}) => {
  sendGrid.send({
    templateId,
    to: address,
    from: 'PlugMe <info@plugme.com.ng>',
    dynamic_template_data: data,
    ...(unsubscribeGroupId && {
      asm: {
        groupId: unsubscribeGroupId
      }
    })
  });
};
