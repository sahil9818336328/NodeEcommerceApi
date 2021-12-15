const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { attachCookiesToResponse, createUserToken } = require('../utils') // CUSTOM FUNCTION FOR GENERATING JWT

// REGISTER
const register = async (req, res) => {
  const { name, email, password } = req.body
  const isEmailInUse = await User.findOne({ email })

  // CHECK FOR EXISTING EMAIL
  if (isEmailInUse) {
    throw new CustomError.BadRequestError('Email already in-use...')
  }

  // MAKING THE ROLE OF FIRST USER AS ADMIN
  const isFirstAccount = (await User.countDocuments({})) === 0
  const role = isFirstAccount ? 'admin' : 'user'

  // CREATE NEW USER
  const user = await User.create({ name, email, password, role })
  const userPayload = createUserToken(user)

  // A FUNCTION GENERATING JWT AND ATTACHING COOKIE WITH RESPONSE
  attachCookiesToResponse({ res, user: userPayload })

  res.status(StatusCodes.CREATED).json({ user: userPayload })
}

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body

  // CHECK FOR FALSY VALUES
  if (!email || !password) {
    throw new CustomError.BadRequestError(
      'Please provide proper credentials...'
    )
  }

  const user = await User.findOne({ email })

  // IF WE CANNOT FIND USER IN THE DATABASE
  if (!user) {
    throw new CustomError.UnauthenticatedError(
      'Please register to continue, invalid Credentials...'
    )
  }

  // CONSTRUCTING PAYLOAD FOR GENERATING JWT
  const userPayload = createUserToken(user)

  // A FUNCTION GENERATING JWT AND ATTACHING COOKIE WITH RESPONSE
  attachCookiesToResponse({ res, user: userPayload })

  res.status(StatusCodes.OK).json({ user: userPayload })
}

// LOGOUT
const logout = async (req, res) => {
  // LOGGING OUT USER
  res.cookie('UserToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  })

  res.status(StatusCodes.OK).json({ msg: 'User logged out successfully !' })
}

module.exports = {
  register,
  login,
  logout,
}
