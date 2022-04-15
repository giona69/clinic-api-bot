const Knex = require("knex")
const Utils = require("./utils")

Utils.init("conn - read")

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  host: process.env.SQL_HOST_READ,
}

// @ts-ignore
const knex = Knex({
  client: "mysql",
  connection: config,
})

module.exports = knex
