const express = require('express');
const { fork } = require('child_process');

const Utils = require('../bin/utils');
const errorHandler = require('../lib/error-handler');

const router = express.Router();

router.get(
  '/*',
  errorHandler(async (req, res) => {
    Utils.log('CRON', 'sync-clinical-trials');
    const worker = fork('./lib/worker-lib');
    worker.on('message', (resultInfo) => {
      Utils.logobj('CRON', 'sync-trials-db', resultInfo);
      worker.kill();
    });

    worker.send({ action: 'syncClinicalTrials' });

    res.send('processing');
  }),
);

module.exports = router;
