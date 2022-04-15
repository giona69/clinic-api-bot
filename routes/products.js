const express = require('express');

const Utils = require('../bin/utils');
const knex = require('../bin/conn');
const { renderProducts } = require('../views/products');
const errorHandler = require('../lib/error-handler');

const router = express.Router();

// TODO fetch html wrapper from wordpress page.
const renderPage = (html) => {
  return `
<html>
<body>
  ${html}
</body>
</html>
`;
};

router.get(
  '/*',
  errorHandler(async (req, res) => {
    const path = req.path.slice(1).replace(/\/$/g, '');

    const product = await knex.from('products').where('url', path).first();
    if (!product) throw new Error('Product not found');

    const html = renderPage(renderProducts(product));
    res.send(html);
  }),
);

module.exports = router;
