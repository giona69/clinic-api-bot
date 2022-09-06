const clinicdb = require('./clinic-db-lib');

process.on('message', async (msg) => {
  let resultInfo;
  // @ts-ignore
  switch (msg.action) {
    case 'syncPUBMED':
      resultInfo = await clinicdb.syncPUBMED();
      // @ts-ignore
      process.send(resultInfo);
      break;
    case 'syncClinicalTrials':
      resultInfo = await clinicdb.syncClinicalTrials();
      // @ts-ignore
      process.send(resultInfo);
      break;
    case 'exportAllTerms':
      resultInfo = await clinicdb.exportAllTerms();
      // @ts-ignore
      process.send(resultInfo);
      break;
    default:
      // @ts-ignore
      process.send('noop');
  }
});
