const CustomError = require('../errors')
const { isTokenValid } = require('../utils')

// AUTHENTICATING USERS
const authenticateUser = async (req, res, next) => {
  // NEXT - BASICALLY PASSES CONTROL TO THE NEXT MIDDLEWARE IN PIPELINE
  const token = req.signedCookies.UserToken

  // IF NOT TOKEN PRESENT, AUTHENTICATION INVALID
  if (!token) {
    throw new CustomError.UnauthenticatedError('ACCESS TOKEN IS REQUIRED...')
  }

  // IF TOKEN IS PRESENT
  try {
    // RUNNING JWT.VERIFY TO VERIFY IF ITS A VALID JWT AND DESTRUCTURING VALUES RETURNED BY IT
    const { name, userID, role } = isTokenValid({ token })

    // ATTACHING USER OBJECT ON REQUEST OBJECT
    req.user = { name, userID, role }
    next()
  } catch (error) {
    throw new CustomError.UnauthenticatedError('ACCESS TOKEN INVALID...')
  }
}

// ONLY ADMIN CAN SEE ALL USERS
const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.AuthorizedError(
        'NOT AUTHORIZED TO ACCESS THIS ROUTE...'
      )
    }
    next()
  }
}

module.exports = {
  authenticateUser,
  authorizePermissions,
}
