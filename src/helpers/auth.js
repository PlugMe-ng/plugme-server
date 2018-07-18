import crypto from 'crypto';
import sendGrid from '@sendgrid/mail';
import jwt from 'jsonwebtoken';

import config from '../config';
import models from '../models';

const sendMail = (emailAddress, mailContent) => {
  sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
  const mailData = {
    to: emailAddress,
    from: 'info@plugme.com.ng',
    subject: 'Verify Your PlugMe Account',
    text: mailContent,
    html: `<em>${mailContent}<em>`
  };
  sendGrid.send(mailData);
};

const createVerificationToken = async (user) => {
  const seed = crypto.randomBytes(20);
  const token = crypto.createHash('sha1')
    .update(seed + user.email).digest('hex');

  const verfication = await models.emailVerification.create({ token });
  verfication.setUser(user.id);
  return token;
};

export const sendVerificationEmail = async (user) => {
  const verificationToken = await createVerificationToken(user);
  // TODO: customize verification token with html and include FE url link
  sendMail(user.email, verificationToken);
};

export const createJwtToken = user =>
  jwt.sign({ email: user.email }, config.SECRET);
