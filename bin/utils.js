const moment = require('moment');
// eslint-disable-next-line unicorn/no-static-only-class
module.exports = class Utils {
  static init(module) {
    // eslint-disable-next-line no-console
    console.log(`${module}: INIT`);
  }

  static log(module, message) {
    // eslint-disable-next-line no-console
    console.log(`${module}: ${message}`);
  }

  static err(module, message) {
    // eslint-disable-next-line no-console
    console.log(`${module}: ERROR!!: ${message}`);
  }

  static logobj(module, message, event) {
    // eslint-disable-next-line no-console
    console.log(`${module}: ${message}`, event);
  }

  static errobj(module, message, event) {
    // eslint-disable-next-line no-console
    console.log(`${module}: ERROR!!: ${message}`, event);
  }

  // noinspection JSUnusedGlobalSymbols
  static encode(toEncode) {
    if (toEncode !== undefined) {
      return encodeURI(toEncode.replace(/\s/g, '+')).toLowerCase();
    }
    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  // noinspection JSUnusedGlobalSymbols
  static splitUrl(urlstring, number) {
    if (urlstring === undefined) {
      return true;
    }

    const arrayPath = urlstring.split('/');
    let howMany = 0;

    arrayPath.forEach((element) => {
      if (element !== '') {
        howMany += 1;
      }
    });

    return howMany < number;
  }

  static getBirthday(dateString) {
    // birthday is a date
    const today = new Date();
    const birthDate = moment(dateString, 'DD/MM/YYYY').toDate();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      // eslint-disable-next-line no-plusplus
      age--;
    }
    return age;
  }

  static truncate(str, n) {
    // eslint-disable-next-line unicorn/prefer-string-slice
    return str.length > n ? `${str.substr(0, n - 1)}...` : str;
  }

  // noinspection JSUnusedGlobalSymbols
  static safeJSONParse(data) {
    let returnData;
    try {
      returnData = JSON.parse(data);
      // eslint-disable-next-line unicorn/prefer-optional-catch-binding
    } catch (error) {
      returnData = undefined;
    }
    return returnData;
  }

  /**
   * @param {number} num
   * @param {number} precision
   * @returns {string}
   */
  static toFixed(num, precision) {
    // eslint-disable-next-line prefer-template
    return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
  }
};
