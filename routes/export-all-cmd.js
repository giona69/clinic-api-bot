#!/usr/bin/env node

// eslint-disable-next-line node/no-unpublished-bin
require('dotenv').config();
// const yargs = require('yargs');
const clinicdb = require('../lib/clinic-db-lib');
const Utils = require('../bin/utils');

// const options = yargs
//   .usage('Usage: --from_date <from_date> --to_date <to_date>')
//   .option('offset', {
//     alias: 'offset',
//     describe: 'offset',
//     type: 'string',
//     demandOption: true,
//   })
//   .option('from_date', {
//     alias: 'from_date',
//     describe: 'date from',
//     type: 'string',
//     demandOption: true,
//   })
//   .option('to_date', {
//     alias: 'to_date',
//     describe: 'date to',
//     type: 'string',
//     demandOption: true,
//   }).argv;

Utils.init('exportAllTerms START');

clinicdb.exportAllTerms();

Utils.log('exportAllTerms', 'END');
