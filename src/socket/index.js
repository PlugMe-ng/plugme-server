import io from 'socket.io';
import jwtSocketAuth from 'socketio-jwt-auth';

import config from '../config';
import models from '../models';
import { cache } from '../helpers';
import messaging from './messaging';

const jwtAuth = jwtSocketAuth.authenticate({
  secret: config.SECRET,
  succeedWithoutToken: true
}, async (payload, done) => {
  if (payload) {
    let user;
    try {
      user = await models.User.findOne({ where: { email: payload.email } });
      return user ? done(null, user) : done(null, false, 'user does not exist');
    } catch (error) {
      return done(error);
    }
  } else {
    return done();
  }
});

/**
 * @export
 * @class Socket
 */
export default class {
  CONNECTED_CLIENTS = 'socket_clients'

  /**
   * Creates an instance of Socket.
   * @param {any} app
   *
   * @memberOf Socket
   */
  constructor(app) {
    this.io = io(app).use(jwtAuth).on('connection', async (socket) => {
      const { user } = socket.request;
      if (user.logged_in) {
        await cache.hmset(this.CONNECTED_CLIENTS, { [user.id]: socket.id });
        messaging.create(socket);
        socket.on('disconnect', async () => {
          await cache.hdel(this.CONNECTED_CLIENTS, user.id);
          this.io.emit('connected_clients', await cache.hgetall(this.CONNECTED_CLIENTS));
        });
      }
      this.io.emit('connected_clients', await cache.hgetall(this.CONNECTED_CLIENTS));
    });
  }

  /**
   * Sends a notification specified by the event to the specified recipient
   *
   * @param {string} event - event
   * @param {string} recipient - recipient
   * @param {Object} payload - payload
   *
   * @returns {void}
   *
   * @memberOf Socket
   */
  send = async (event, recipient, payload) => {
    const recipientSocket = await cache.hget(this.CONNECTED_CLIENTS, recipient);
    this.io.to(recipientSocket).emit(event, payload);
  }
}
