#!/usr/bin/env node

// eslint-disable-next-line node/no-unpublished-bin
require('dotenv').config();
const yargs = require('yargs');
const clinicdb = require('../lib/clinic-db-lib');
const Utils = require('../bin/utils');

const options = yargs.usage('Usage: --offset <offset>').option('offset', {
  alias: 'offset',
  describe: 'offset',
  type: 'string',
  demandOption: true,
});

Utils.init('exportPubmed START');
console.log(options);
// @ts-ignore
console.log(options.offset);

// @ts-ignore
clinicdb.exportPubmed(0);

Utils.log('exportAllTerms', 'END');
