const Review = require('../models/Review')
const Product = require('../models/Product')

const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { checkPermissions } = require('../utils')

// GET ALL REVIEWS
const getAllReviews = async (req, res) => {
  // POPULATE- REFERENCE DOCUMENTS IN OTHER COLLECTIONS
  const reviews = await Review.find({}).populate({
    path: 'product',
    select: 'name price company',
  })
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length })
}

// GET SINGLE REVIEW
const getSingleReview = async (req, res) => {
  const { id: productID } = req.params
  const review = await Review.findOne({ _id: productID })
  if (!review) {
    throw new CustomError.NotFoundError(
      `No product found with id: ${productID}`
    )
  }

  res.status(StatusCodes.OK).json(review)
}

// CREATE REVIEW
const createReview = async (req, res) => {
  const { product: productID } = req.body

  // SEARCH FOR THE PRODUCT TO LEAVE A REVIEW ON
  const isValidProduct = await Product.findOne({ _id: productID })
  if (!isValidProduct) {
    throw new CustomError.BadRequestError(
      `No product found with id: ${productID}`
    )
  }

  // CHECK IS THERE'S ALREADY A REVIEW FOR THE PRODUCT
  const reviewAlreadySubmitted = await Review.findOne({
    product: productID,
    user: req.user.userID,
  })

  if (reviewAlreadySubmitted) {
    throw new CustomError.BadRequestError(
      'Review already submitted for this product'
    )
  }

  // CREATE A REVIEW
  req.body.user = req.user.userID
  const review = await Review.create(req.body)
  res.status(StatusCodes.CREATED).json({ review })
}

// UPDATE REVIEW
const updateReview = async (req, res) => {
  const { id: productID } = req.params
  const { rating, title, comment } = req.body
  const review = await Review.findOne({ _id: productID })

  // CHECK FOR REVIEW IN MONGODB
  if (!review) {
    throw new CustomError.NotFoundError(
      `No product found with id: ${productID}`
    )
  }

  // ONLY ADMIN OR THE USER WHICH CREATED THAT REVIEW CAN ONLY EDIT THEIR REVIEW
  checkPermissions(req.user, review.user)

  // UPDATE WITH NEW VALUES
  review.rating = rating
  review.title = title
  review.comment = comment

  // SAVE THE DOCUMENT
  await review.save() // POST SAVE HOOK WILL BE INVOKED

  res.status(StatusCodes.OK).json({ review })
}

// DELETE REVIEW
const deleteReview = async (req, res) => {
  const { id: productID } = req.params
  const review = await Review.findOne({ _id: productID })
  if (!review) {
    throw new CustomError.NotFoundError(
      `No product found with id: ${productID}`
    )
  }

  checkPermissions(req.user, review.user)
  await review.remove() // POST REMOVE HOOK WILL BE INVOKED

  res.status(StatusCodes.OK).json({ msg: 'Success, review removed' })
}

module.exports = {
  getAllReviews,
  getSingleReview,
  createReview,
  updateReview,
  deleteReview,
}
