const fetch = require('node-fetch');
const XLSX = require('xlsx');
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify').default;

const Utils = require('../bin/utils');
const knex = require('../bin/conn');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const BUCKET = process.env.S3_BUCKET;
if (!BUCKET) {
  throw new Error('Missing env variable: "S3_BUCKET"');
}

const FIELDS = {
  Brand: 'brand',
  Model: 'model',
  'Model Code': 'model_code',
  Released: 'released',
  'General Extras': 'general_extras',
  'Device Category': 'device_category',
  'List of Additional Features': 'list_of_additional_features',
  'Depth (mm)': 'depth',
  'Mass (g)': 'mass',
  Platform: 'platform',
  'Operating System': 'operating_system',
  'Software Extras': 'software_extras',
  'CPU Clock (MHz)': 'cpu_clock',
  CPU: 'cpu',
  'RAM Capacity (MiB RAM)': 'ram_capacity',
  'Non-volatile Memory Capacity (MiB non-volatile)': 'non_volatile_memory_capacity',
  'Display Diagonal (mm)': 'display_diagonal',
  'Display Diagonal (inch)': 'display_diagonal',
  Resolution: 'resolution',
  'Pixel Size (mm/pixel)': 'pixel_size',
  'Pixel Density (PPI)': 'pixel_density',
  'Display Type': 'display_type',
  'Display Subtype': 'display_subtype',
  'Scratch Resistant Screen': 'scratch_resistant_screen',
  'Graphical Controller': 'graphical_controller',
  'Supported Cellular Bands': 'supported_cellular_bands',
  'Supported Cellular Data Links': 'supported_cellular_data_links',
  'SIM Card Slot': 'sim_card_slot',
  'SAR (head) (W/kg)': 'sar',
  'SAR measurement method (head)': 'sar_measurement_method',
  'SAR (body) (W/kg)': 'sar',
  'SAR measurement method (body)': 'sar_measurement_method',
  'Dual Cellular Network Operation': 'dual_cellular_network_operation',
  Bluetooth: 'bluetooth',
  'Wireless LAN': 'wireless_lan',
  'Wireless Services': 'wireless_services',
  NFC: 'nfc',
  'Camera Placement': 'camera_placement',
  'Camera Image Sensor': 'camera_image_sensor',
  'Image Sensor Pixel Size (micrometer)': 'image_sensor_pixel_size',
  'Camera Resolution (pixel)': 'camera_resolution',
  'Number of effective pixels (MP camera)': 'number_of_effective_pixels',
  'Zoom (x optical zoom)': 'zoom',
  'Digital Zoom (x digital zoom)': 'digital_zoom',
  'Video Recording (pixel)': 'video_recording',
  'Camcorder Frame Rate (fps)': 'camcorder_frame_rate',
  Flash: 'flash',
  'Camera Extra Functions': 'camera_extra_functions',
  'Aux. Camera Image Sensor': 'aux_camera_image_sensor',
  'Aux. Camera Number of Pixels  (MP aux. cam)': 'aux_camera_number_of_pixels',
  'Secondary Camera Placement': 'secondary_camera_placement',
  'Secondary Camera Sensor': 'secondary_camera_sensor',
  'Secondary Image Sensor Pixel Size (micrometer)': 'secondary_image_sensor_pixel_size',
  'Secondary Camera Number of pixels (MP sec. cam)': 'secondary_camera_number_of_pixels',
  'Secondary Camera Extra Functions': 'secondary_camera_extra_functions',
  'Built-in compass': 'built_in_compass',
  'Built-in accelerometer': 'built_in_accelerometer',
  'Built-in gyroscope': 'built_in_gyroscope',
  'Additional sensors': 'additional_sensors',
  'Built-in Barcode Scanner': 'built_in_barcode_scanner',
  Battery: 'battery',
  'Battery Build': 'battery_build',
  'Talk Time (hours)': 'talk_time',
  'Wireless Charging': 'wireless_charging',
  'Price Currency': 'price_currency',
  Image: 'image',
  'Data Integrity': 'data_integrity',
  Added: 'added',
  ID: 'id',
};

const buildSlug = (data) => {
  const brand = slugify(data.brand);
  const model = slugify(data.model);
  return [data.id, brand, model].join('/').toLowerCase();
};

const excelToSql = (row) => {
  const data = Object.fromEntries(
    Object.entries(row)
      .filter(([k]) => FIELDS[k])
      .map(([k, v]) => [FIELDS[k], v]),
  );

  data.released = new Date(data.released);
  data.url = buildSlug(data);
  return data;
};

const isNotImportedYet = (filename) => {
  const data = path.parse(filename);
  return data.ext === '.xlsx' && !data.name.includes('-imported-');
};

const markImported = (filename) => {
  const data = path.parse(filename);
  const name = [data.name, 'imported', Date.now()].join('-');
  return name + data.ext;
};

const listFiles = async () => {
  const res = await s3.listObjects({ Bucket: BUCKET }).promise();
  return res.Contents?.map((x) => x.Key).filter((x) => isNotImportedYet(x));
};

const fetchFile = async (filename) => {
  if (fs.existsSync(filename)) fs.rmSync(filename);

  const file = fs.createWriteStream(filename);

  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket: BUCKET, Key: filename })
      .on('httpData', (chunk) => file.write(chunk))
      .on('httpDone', () => {
        file.end();
        resolve(true);
      })
      .on('error', (e) => reject(e))
      .send();
  });
};

const archiveFile = async (filename) => {
  const newName = markImported(filename);
  const source = [BUCKET, filename].join('/');
  await s3.copyObject({ Bucket: BUCKET, CopySource: source, Key: newName }).promise();
  await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
};

const importFile = async (filename) => {
  // Parse file as json
  const file = XLSX.readFile(filename);
  const sheet = file.Sheets[file.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);

  // Get existing products
  // const existing = (await knex.from('products').select('id')).map((r) => r.id);

  const returnValue = { skipped: 0, inserted: 0 };

  for (const row of json) {
    const data = excelToSql(row);

    // if (existing.includes(data.id)) {
    //   ret.skipped++;
    //   continue;
    // }

    // Insert new products
    await knex('products').insert(data).onConflict('id').merge();
    returnValue.inserted += 1;
  }

  return returnValue;
};

const syncDB = async () => {
  Utils.log('CLINIC-DB-LIB', 'syncDB');
  const dbPub = 'pubmed';
  const termSearch = 'Stefano+Luminari';
  const apiKey = 'c6830c2e17281d6f44c779ea5bf911cd1f08';

  const eSearch = await fetch(
    // eslint-disable-next-line max-len
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${dbPub}&term=${termSearch}&usehistory=y&api_key=${apiKey}&retmode=json`,
  )
    .then((response) => {
      Utils.logobj('CLINIC-DB-LIB', 'esearch FETCH', response);
      if (response.status >= 200 && response.status <= 299) {
        return response.json();
      }
      return { err: `esearch api not responding, status ${response.status}` };
    })
    .catch((error) => {
      Utils.errobj('CLINIC-DB-LIB', 'esearch FETCH ERROR', error);
      return { err: error };
    });

  if (eSearch.err !== undefined) {
    return 'fail';
  }
  Utils.logobj('CLINIC-DB-LIB', 'esearch', eSearch);

  return 'ok';
};

module.exports = {
  syncDB,
  importFile,
};
