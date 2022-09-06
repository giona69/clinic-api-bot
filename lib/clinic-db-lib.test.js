require('dotenv').config();
const clinicdb = require('./clinic-db-lib');

describe('ClinicDB Lib sync', () => {
  test('syncDB', async () => {
    expect.assertions(1);

    // clinicdb.exportAllTerms();
    clinicdb.exportPubmed(1049);

    expect(true).toBeTruthy();
  }, 500000);
});
