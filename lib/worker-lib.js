const clinicdb = require('./clinic-db-lib');

process.on('message', async (msg) => {
  let resultInfo;
  switch (msg.action) {
    case 'syncClinicDBData':
      resultInfo = await clinicdb.syncDB();
      // @ts-ignore
      process.send(resultInfo);
      break;
    default:
      // @ts-ignore
      process.send('noop');
  }
});
