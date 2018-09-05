import io from 'socket.io';
import jwtSocketAuth from 'socketio-jwt-auth';

import config from '../config';
import models from '../models';

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

const connectedClients = { };

/**
 * @export
 * @class Socket
 */
export default class {
  /**
   * Creates an instance of Socket.
   * @param {any} app
   *
   * @memberOf Socket
   */
  constructor(app) {
    this.io = io(app).use(jwtAuth).on('connection', (socket) => {
      const { user } = socket.request;
      if (user.logged_in) {
        // TODO: use redis
        connectedClients[user.id] = socket.id;
      }
      socket.emit('connected_clients', connectedClients);
      socket.on('disconnect', () => {
        if (user.logged_in) {
          delete connectedClients[user.id];
        }
      });
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
  send = (event, recipient, payload) => {
    const recipientSocket = connectedClients[recipient];
    if (recipientSocket) {
      this.io.to(recipientSocket).emit(event, payload);
    }
  }
}
