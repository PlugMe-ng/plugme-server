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
    html: mailContent
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

// TODO: customize verification token with html and include FE url link
const createVerificationMessage = (user, verificationToken) =>
  `
    <p>Hi, ${user.fullName}</p>

    <p>Please verify your PlugMe account using the link below</p>

    ${verificationToken}
  `;

export const sendVerificationEmail = async (user) => {
  const verificationToken = await createVerificationToken(user);
  sendMail(user.email, createVerificationMessage(user, verificationToken));
};

export const createJwtToken = user =>
  jwt.sign({ email: user.email }, config.SECRET);
