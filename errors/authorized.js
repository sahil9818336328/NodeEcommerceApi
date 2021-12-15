const { StatusCodes } = require('http-status-codes')
const CustomAPIError = require('./custom-api')

class AuthorizedError extends CustomAPIError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.UNAUTHORIZED
  }
}

module.exports = AuthorizedError
