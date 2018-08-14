/**
 * @fileOverview Application's entry point
 *
 * @author Franklin Chieze
 *
 * @requires NPM:body-parser
 * @requires NPM:cors
 * @requires NPM:dotenv
 * @requires NPM:express
 * @requires NPM:morgan
 * @requires NPM:path
 * @requires NPM:swagger-jsdoc
 * @requires ./middleware
 * @requires ./routes
 */

import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import logger from 'morgan';
import path from 'path';
import swaggerUI from 'swagger-ui-express';
import trimmer from 'express-trimmer';

import middleware from './middleware';
import routes from './routes';
import apiDocs from './api-docs.json';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = express();

app.set('port', port);

// Log requests to the console.
if (env !== 'test') {
  app.use(logger('dev'));
}

// CORS
/*
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin');
  res.header('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');
  next();
});
*/
app.use(cors());

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(apiDocs));

app.use(middleware.api);

// set content type
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

app.get('/', (req, res) => {
  res.sendSuccess(['Welcome to PlugMe Server']);
});

app.use(trimmer);

app.use('/v1', routes);

// 404 error handler
app.use((req, res) =>
  res.sendFailure([`The endpoint '${req.path}' could not be found.`], 404));

app.listen(port, () => {
  // TODO: remove this in production
  console.log(`Server started successfully on port ${port}`);
});

export default app;
