#!/usr/bin/env node

// eslint-disable-next-line node/no-unpublished-bin
require('dotenv').config();
const yargs = require('yargs');
const clinicdb = require('../lib/clinic-db-lib');
const Utils = require('../bin/utils');

const options = yargs.option('offset', {
  alias: 'offset',
  describe: 'offset',
  type: 'string',
  demandOption: true,
});

Utils.init('exportAllTerms START');

clinicdb.exportPubmed(options.offset);

Utils.log('exportAllTerms', 'END');
