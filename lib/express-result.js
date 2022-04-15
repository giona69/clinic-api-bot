const ExpressError = require("./express-error")

class ExpressResult {
  /**
   * @param {object} expression
   * @param {object|Array|undefined} [expression.result]
   * @param {string|undefined} [expression.error]
   * @param {number} [expression.status]
   */
  constructor({ result, error, status = 500 }) {
    if (error) {
      this.error = new ExpressError(error, status)
    }
    this.result = result
  }
}

module.exports = ExpressResult
