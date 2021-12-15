const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const path = require('path')

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
  const products = await Product.find({})
  res.status(StatusCodes.OK).json({ products, count: products.length })
}

// GET SINGLE PRODUCT
const getSingleProduct = async (req, res) => {
  const { id: productID } = req.params
  const product = await Product.findOne({ _id: productID }).populate('reviews')
  if (!product) {
    throw new CustomError.NotFoundError(
      `No product found with id: ${productID}...`
    )
  }
  res.status(StatusCodes.OK).json({ product })
}

// CREATE PRODUCT AND ATTACH USER ID TO IT
const createProduct = async (req, res) => {
  req.body.user = req.user.userID
  const product = await Product.create(req.body)
  res.status(StatusCodes.CREATED).json({ product })
}

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  const { id: productID } = req.params
  const product = await Product.findOneAndUpdate({ _id: productID }, req.body, {
    new: true,
    runValidators: true,
  })

  if (!product) {
    throw new CustomError.NotFoundError(
      `No product found with id: ${productID}...`
    )
  }
  res.status(StatusCodes.OK).json({ product })
}

// DELETE PRODUCT, USING REMOVE METHOD
const deleteProduct = async (req, res) => {
  const { id: productID } = req.params

  const product = await Product.findOne({ _id: productID })
  if (!product) {
    throw new CustomError.NotFoundError(
      `No product found with id: ${productID}...`
    )
  }

  await product.remove() // RUNS PRE-HOOK
  res.status(StatusCodes.OK).json({ msg: 'Success, product removed !' })
}

// UPLOAD IMAGE FILE
const uploadImage = async (req, res) => {
  // CHECK FOR UPLOADED FILE
  if (!req.files) {
    throw new CustomError.BadRequestError('Please upload a file')
  }

  // CHECK FOR FILE WITH TYPE IMAGE
  const productImage = req.files.image
  if (!productImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please upload file of type image')
  }

  // CHECK FOR IMAGE SIZE
  const maxSize = 1024 * 1024
  if (productImage.size > maxSize) {
    throw new CustomError.BadRequestError('Please upload file less than 1MB')
  }

  // CONSTRUCT IMAGE PATH
  const imagePath = path.join(
    __dirname,
    '../public/uploads/' + `${productImage.name}`
  )

  // MOVE IMAGE TO THE SPECIFIED IMAGE PATH
  await productImage.mv(imagePath)

  res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` })
}

module.exports = {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
}
