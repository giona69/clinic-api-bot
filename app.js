require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const ExpressError = require('./lib/express-error');

const Utils = require('./bin/utils');
require('make-promises-safe');
const cronLib = require('./lib/cron-lib');

const index = require('./routes');
const health = require('./routes/health');
const syncClinicDb = require('./routes/sync-clinic-db');

const app = express();

app.use(
  compression({
    filter() {
      return true;
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static('public'));

app.use('/health', health);

if (process.env.CRON_ACTIVE) {
  cronLib.startCron();
}

// redirect https
app.use((req, res, next) => {
  if (process.env.ENV === 'PROD') {
    req.get('X-Forwarded-Proto') !== 'https'
      ? res.redirect(`https://${req.hostname}${req.url}`)
      : next();
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (process.env.ENV === 'DEV') {
    const auth = { login: 'webdev', password: 'wd2018' };

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (!login || !password || login !== auth.login || password !== auth.password) {
      res.set('WWW-Authenticate', 'Basic realm="401"');
      res.status(401).send('Authentication required.');
      return;
    }
  }

  next();
});

// cross origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    // eslint-disable-next-line max-len
    'Origin, Referer, X-Requested-With, Content-Type, Accept, access-control-allow-origin, Authorization',
  );
  next();
});

app.options('*', (req, res) => {
  res.status(200).send('ok');
});

app.use('/', index);
app.use('/sync-clinic-db', syncClinicDb);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new ExpressError(`${req.originalUrl} Not Found`, 404));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  Utils.err('API-GEK', err.message);
  // render the error result in json
  res.status(err.status || 500);
  return res.json({ code: err.status || 500, error: err.message });
});

module.exports = app;
