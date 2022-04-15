const Knex = require('knex');
const Utils = require('./utils');

Utils.init('conn');

const config = {
  user: process.env.SQL_USER_TEST,
  password: process.env.SQL_PASSWORD_TEST,
  database: process.env.SQL_DATABASE_TEST,
  host: process.env.SQL_HOST_TEST,
};

// @ts-ignore
const knex = Knex({
  client: 'mysql',
  connection: config,
});

module.exports = knex;
