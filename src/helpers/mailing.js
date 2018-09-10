import sendGrid from '@sendgrid/mail';

sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

export default ({ address, subject, content }) => {
  const mailData = {
    to: address,
    from: 'info@plugme.com.ng',
    subject,
    text: content,
    html: content
  };
  sendGrid.send(mailData);
};
