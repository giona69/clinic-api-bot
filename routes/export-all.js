const express = require('express');
const { fork } = require('child_process');

const Utils = require('../bin/utils');
const errorHandler = require('../lib/error-handler');

const router = express.Router();

router.get(
  '/*',
  errorHandler(async (req, res) => {
    Utils.log('CRON', 'export-all');
    const worker = fork('./lib/worker-lib');
    worker.on('message', (resultInfo) => {
      Utils.logobj('CRON', 'export-all', resultInfo);
      worker.kill();
    });

    worker.send({ action: 'exportAllTerms' });

    res.send('processing');
  }),
);

module.exports = router;
