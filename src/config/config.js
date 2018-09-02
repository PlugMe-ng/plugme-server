require('dotenv').config();

module.exports = {
  development: {
    host: process.env.HOST,
    database: process.env.DATABASE,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    dialect: 'postgres',
    ssl: true,
    native: true,
  },
  test: {
    database: process.env.DATABASE_TEST,
    dialect: 'postgres',
    host: '127.0.0.1',
    operatorsAliases: false,
    password: process.env.DATABASE_TEST_PASSWORD,
    username: process.env.DATABASE_TEST_USERNAME,
    url: process.env.DATABASE_TEST_URL
  },
  production: {
    dialect: 'postgres',
    url: process.env.DATABASE_URL,
    operatorsAliases: false,
  },
  SECRET: process.env.SECRET,
};
