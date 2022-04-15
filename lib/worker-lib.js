const phonedb = require('./phonedb-lib');

process.on('message', async (msg) => {
  let resultInfo;
  switch (msg.action) {
    case 'syncPhoneDBData':
      resultInfo = await phonedb.syncDB();
      // @ts-ignore
      process.send(resultInfo);
      break;
    default:
      // @ts-ignore
      process.send('noop');
  }
});
