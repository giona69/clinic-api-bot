const { CronJob } = require('cron');
const { fork } = require('child_process');
const Utils = require('../bin/utils');

const startCron = () => {
  const jobN = new CronJob('00 10 00 * * *', () => {
    Utils.log('CRON', 'syncClinicDBData CRON');
    const worker = fork('./lib/worker-lib');
    worker.on('message', (resultInfo) => {
      Utils.logobj('CRON', 'syncClinicDBData CRON', resultInfo);
      worker.kill();
    });

    worker.send({ action: 'syncClinicDBData' });
  });
  jobN.start();
};

module.exports = {
  startCron,
};
