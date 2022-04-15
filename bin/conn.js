const Knex = require("knex")
const Utils = require("./utils")

Utils.init("conn")

const client = process.env.SQL_CLIENT || "mysql"
let config = {
  user: process.env.SQL_USER || process.env.RDS_USERNAME,
  password: process.env.SQL_PASSWORD || process.env.RDS_PASSWORD,
  database: process.env.SQL_DATABASE || process.env.RDS_DB_NAME,
  host: process.env.SQL_HOST || process.env.RDS_HOSTNAME,
}

if (process.env.SQL_CONFIG) {
  config = JSON.parse(process.env.SQL_CONFIG)
}

// @ts-ignore
const knex = Knex({
  client,
  connection: config,
})

module.exports = knex
