import crypto from 'crypto';
import sendGrid from '@sendgrid/mail';
import jwt from 'jsonwebtoken';

import config from '../config';
import models from '../models';

sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

// TODO: move this to an helper or utility class
export const sendMail = ({ address, subject, content }) => {
  const mailData = {
    to: address,
    from: 'info@plugme.com.ng',
    subject,
    text: content,
    html: content
  };
  sendGrid.send(mailData);
};

const createToken = async (user, type) => {
  const seed = crypto.randomBytes(20);
  const token = crypto.createHash('sha1')
    .update(seed + user.email).digest('hex');

  const authAction = await models.emailAuthAction
    .create({ token, type });
  authAction.setUser(user.id);
  return token;
};

// TODO: customize verification token with html and include FE url link
const createVerificationMessage = (user, verificationToken) => ({
  content: `
    <p>Hi, ${user.fullName}</p>

    <p>Please verify your PlugMe account using the link below</p>

    <a href="https://plugme-client-staging.herokuapp.com/verify-account?token=${verificationToken}">Verify your account</a>

    <p>If the link above does not work, copy and paste the link below in your browser<p>

    https://plugme-client-staging.herokuapp.com/verify-account?token=${verificationToken}
  `,
  subject: 'Verify Your PlugMe Account'
});

const createPasswordResetMail = (user, token) =>
  ({
    mailContent: `
    <p>Hi, ${user.fullName}</p>
    
    <p>You requested a password reset, click the link below to reset your password</p>
    
    <a href="https://plugme-client-staging.herokuapp.com/password-reset?token=${token}">Reset your password</a>
    
    <p>If the link above does not work, copy and paste the link below in your browser<p>
    
    https://plugme-client-staging.herokuapp.com/password-reset?token=${token}
    
    <p>Note that the link is valid for 12 hours</p>
    
    <p>Please ignore this mail if you did not request a password reset</p>
    `,
    subject: 'Reset Your PlugMe Account Password'
  });

export const generateUserName = (name) => {
  const randomInt = crypto.randomBytes(20).readUInt16BE();
  return `${name.substr(0, name.indexOf(' '))}${randomInt}`.toLowerCase();
};

export const createJwtToken = user =>
  jwt.sign({ email: user.email }, config.SECRET);

export const sendAuthActionMail = async (user, type) => {
  const token = await createToken(user, type);
  switch (type) {
    case 'verify': {
      const { content, subject } = createVerificationMessage(user, token);
      sendMail({ address: user.email, subject, content });
    }
      break;
    case 'reset': {
      const { subject, mailContent: content } =
        createPasswordResetMail(user, token);
      sendMail({ address: user.email, subject, content });
    }
      break;
    default:
      break;
  }
};
