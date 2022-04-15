const express = require('express');
const Utils = require('../bin/utils');

const router = express.Router();

Utils.init('index');

router.get('/', (req, res) => {
  Utils.log('INDEX', 'LOG: aws index');
  res.send('index');
});

module.exports = router;
