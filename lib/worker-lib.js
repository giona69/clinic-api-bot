const clinicdb = require('./clinic-db-lib');

process.on('message', async (msg) => {
  let resultInfo;
  switch (msg.action) {
    case 'syncClinicDBData':
      resultInfo = await clinicdb.syncClinicDBData();
      // @ts-ignore
      process.send(resultInfo);
      break;
    case 'syncTrialsDBData':
      resultInfo = await clinicdb.syncTrialsDBData();
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
