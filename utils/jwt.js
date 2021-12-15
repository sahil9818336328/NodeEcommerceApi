const jwt = require('jsonwebtoken') // JSON WEB TOKEN FOR ACCESSING PRIVATE ROUTES AND RESOURCES

// FUNCTION FOR GENERATING JSON WEB TOKEN
const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  })
  return token
}

// FUNCTION FOR TOKEN VALIDATION
const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET)

// FUNCTION FOR ATTACHING COOKIES TO RESPONSE
const attachCookiesToResponse = ({ res, user }) => {
  const token = createJWT({ payload: user })

  // COOKIES
  // STORING COOKIE WITH THE HTTP-REQUEST MADE || COOKIES HELP BROWSERS REMEMBER ITS CLIENTS
  // ON THE NEXT HTTP-REQUEST MADE BROWSER AUTOMATICALLY ATTACHES THE COOKIE
  // STORING JSON WEB TOKEN INSIDE A COOKIE
  const oneDay = 1000 * 60 * 60 * 24
  // STORING COOKIE IN WEB BROWSER
  res.cookie('UserToken', token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === 'production',
    signed: true,
  })
}

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
}
