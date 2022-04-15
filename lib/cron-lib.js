const { CronJob } = require('cron');
const { fork } = require('child_process');
const Utils = require('../bin/utils');

const startCron = () => {
  const jobN = new CronJob('00 10 00 * * *', () => {
    Utils.log('CRON', 'syncNetwork CRON');
    const worker = fork('./lib/worker-lib');
    worker.on('message', (resultInfo) => {
      Utils.logobj('CRON', 'syncNetwork CRON', resultInfo);
      worker.kill();
    });

    worker.send({ action: 'syncPhoneDBData' });
  });
  jobN.start();
};

module.exports = {
  startCron,
};
