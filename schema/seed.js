require("dotenv").config()
const { importFile } = require("../lib/phonedb-lib")
// const { syncDB } = require('../lib/phonedb-lib');
const Utils = require("../bin/utils")

if (require.main === module) {
  Utils.log("Importing seed data...")

  // syncDB()
  importFile(`${__dirname}/db-seed.xlsx`)
    .then((result) => {
      Utils.log(result)
      return true
    })
    .catch((error) => {
      Utils.log(error)
    })
}
