/**
 * @fileOverview Auth controller tests
 *
 * @author Franklin Chieze
 *
 * @requires NPM:bcrypt
 * @requires NPM:chai
 * @requires NPM:chai-http
 * @requires ../mock
 * @requires ../../build/models
 * @requires ../../build/server
 */

import bcrypt from 'bcrypt';
import chai from 'chai';
import chaiHttp from 'chai-http';

import mock from '../mock';
import models from '../../src/models';
import server from '../../src/server';

const should = chai.should();
const { expect } = chai;
chai.use(chaiHttp);

before((done) => {
  models.sequelize.sync({ force: true }).then(() => {
    done(null);
  }).catch((error) => {
    done(error);
  });
});

describe('AuthController', () => {
  beforeEach(async () => {
    await models.User.destroy({ where: {} });
  });

  describe('POST: /v1/auth/signin', (done) => {
    beforeEach(async () => {
      await models.User.create({
        ...mock.user1,
        verified: true,
        password: await bcrypt.hash(
          mock.user1.password,
          1
        )
      });
    });
    it('should return a user token on successful sign in', (done) => {
      chai.request(server)
        .post('/v1/auth/signin')
        .send(mock.user1)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('data');
          expect(res.body.data).to.be.an('Object');
          res.body.data.should.have.property('user');
          expect(res.body.data.user.id).to.not.be.undefined;
          expect(res.body.data.user.displayName)
            .to.equal(mock.user1.displayName);
          expect(res.body.data.user.email).to.equal(mock.user1.email);
          expect(res.body.data.user.password).to.be.undefined;
          res.body.data.should.have.property('userToken');
          expect(res.body.errors).to.be.undefined;
          done();
        });
    });
    it('should not sign in user without email', (done) => {
      chai.request(server)
        .post('/v1/auth/signin')
        .send(mock.user1WithoutEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email field is required.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not sign in user with malformed email', (done) => {
      chai.request(server)
        .post('/v1/auth/signin')
        .send(mock.user1WithMalformedEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email format is invalid.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not sign in user with malformed email [2]', (done) => {
      chai.request(server)
        .post('/v1/auth/signin')
        .send(mock.user2WithMalformedEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email format is invalid.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not sign in user with malformed email [3]', (done) => {
      chai.request(server)
        .post('/v1/auth/signin')
        .send(mock.user3WithMalformedEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email format is invalid.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not sign in user without password', (done) => {
      chai.request(server)
        .post('/v1/auth/signin')
        .send(mock.user1WithoutPassword)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The password field is required.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
  });

  describe('POST: /v1/auth/signup', (done) => {
    it('should register a new user', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user1)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('data');
          expect(res.body.data).to.be.an('Object');
          res.body.data.should.have.property('user');
          expect(res.body.data.user.id).to.not.be.undefined;
          expect(res.body.data.user.displayName)
            .to.equal(mock.user1.displayName);
          expect(res.body.data.user.email).to.equal(mock.user1.email);
          expect(res.body.data.user.password).to.be.undefined;
          expect(res.body.errors).to.be.undefined;
          done();
        });
    });
    it('should not register a user without username', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user1WithoutDisplayName)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The username field is required.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not register a user without email', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user1WithoutEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email field is required.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not register a user with malformed email', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user1WithMalformedEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email format is invalid.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not register a user with malformed email [2]', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user2WithMalformedEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email format is invalid.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not register a user with malformed email [3]', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user3WithMalformedEmail)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The email format is invalid.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it('should not register a user without password', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user1WithoutPassword)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('The password field is required.');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
  });

  describe('POST: /v1/auth/signup', (done) => {
    beforeEach(async () => {
      await models.User.create({
        ...mock.user1,
        password: await bcrypt.hash(
          mock.user1.password,
          process.env.NODE_ENV === 'production' ? 10 : 1
        )
      });
    });
    it('should not register a user with an existing email', (done) => {
      chai.request(server)
        .post('/v1/auth/signup')
        .send(mock.user1)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('errors');
          expect(res.body.errors).to.be.an('Array');
          expect(res.body.errors)
            .to.include('Username or email already exists');
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
  });
});
