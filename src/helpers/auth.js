import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import config from '../config';
import models from '../models';
import sendMail from './mailing';

const createToken = async (user, type) => {
  const seed = crypto.randomBytes(20);
  const token = crypto.createHash('sha1').update(seed + user.email).digest('hex');
  const authAction = await models.emailAuthAction.create({ token, type });
  authAction.setUser(user.id);
  return token;
};

export const generateUserName = (name) => {
  const randomInt = crypto.randomBytes(20).readUInt16BE();
  return `${name.substr(0, name.indexOf(' '))}${randomInt}`.toLowerCase();
};

export const createJwtToken = user =>
  jwt.sign({ email: user.email }, config.SECRET);

export const sendAuthActionMail = async (user, type) => {
  const token = await createToken(user, type);
  switch (type) {
    case 'verify':
      sendMail({
        templateId: 'd-80aa362028504dffa50fcd7cfd17d617',
        address: user.email,
        data: {
          fullName: user.fullName,
          link: `${config.FE_URL}/verify-account?token=${token}`
        }
      });
      break;
    case 'reset':
      sendMail({
        templateId: 'd-755be4a5d84d42379f040f7479562cf2',
        address: user.email,
        data: {
          fullName: user.fullName,
          link: `${config.FE_URL}/password-reset?token=${token}`,
        },
      });
      break;
    default:
      break;
  }
};
