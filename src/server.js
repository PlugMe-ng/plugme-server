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

const app = express();

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

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(process.env.PORT || 9000);
