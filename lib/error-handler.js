// eslint-disable-next-line func-names
const errorHandler = (function_) =>
  // eslint-disable-next-line func-names
  function asyncUtilWrap(req, res, next, ...args) {
    const functionReturn = function_(req, res, next, ...args);
    // eslint-disable-next-line promise/no-callback-in-promise
    return Promise.resolve(functionReturn).catch(next);
  };

module.exports = errorHandler;
