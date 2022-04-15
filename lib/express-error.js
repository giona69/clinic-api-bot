class ExpressError {
  /**
   * @param {string} message
   * @param {number} [status]
   */
  constructor(message, status = 500) {
    this.message = message
    this.status = status
    this.error = true
  }
}

module.exports = ExpressError
