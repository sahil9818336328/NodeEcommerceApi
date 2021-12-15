const Order = require('../models/Order')
const Product = require('../models/Product')

const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { checkPermissions } = require('../utils')

// GET ALL ORDERS ONLY FOR ADMIN
const getAllOrders = async (req, res) => {
  const orders = await Order.find({})
  res.status(StatusCodes.OK).json({ orders, count: orders.length })
}

// GET SINGLE ORDER
const getSingleOrder = async (req, res) => {
  const { id: orderID } = req.params

  const order = await Order.findOne({ _id: orderID })
  if (!order) {
    throw new CustomError.NotFoundError(`No order found with id: ${orderID}`)
  }

  res.status(StatusCodes.OK).json({ order })
}

// GET CURRENT USER'S ORDERS
const getCurrentUserOrders = async (req, res) => {
  // GET ALL THE ORDERS FOR THE LOGGED IN USER
  const orders = await Order.find({ user: req.user.userID })
  if (!orders) {
    throw new CustomError.NotFoundError(
      `Oops!, there's no order pertaining to user with id: ${req.user.userID}`
    )
  }
  res.status(StatusCodes.OK).json({ orders, count: orders.length })
}

// CREATE ORDER
const fakeStripeApi = async ({ amount, currency }) => {
  const client_secret = process.env.STRIPE_CLIENT_SECRET
  return { client_secret, amount }
}
const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body

  // CHECK FOR EMPTY CART
  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError('No cartItems provided')
  }

  // CHECK IF TAX AND SHIPPING FEE ARE PRESENT
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError('Please provide tax and shipping fee')
  }

  let orderItems = []
  let subtotal = 0

  // USING FOR-OF LOOP TO RUN CODE ASYNCHRONOUSLY
  for (const item of cartItems) {
    // FIND THE PRODUCT OF WHOSE YOU WANT TO CREATE AN ORDER
    const dbProduct = await Product.findOne({ _id: item.product })

    // IF NO PRODUCT FOUND
    if (!dbProduct) {
      throw new CustomError(`No product found with id: ${item.product}`)
    }

    // DESTRUCTURE PROPERTIES FROM THE PRODUCT AND CREATE AN ORDER WITH THE REQUIRED PROPERTIES IN SINGLE ORDER ITEM SCHEMA
    const { name, price, image, _id } = dbProduct
    // console.log(name, price, image)

    const singleOrderItem = {
      name,
      price,
      image,
      amount: item.amount,
      product: _id,
    }

    // CALCULATE ORDERS AND SUBTOTAL
    orderItems = [...orderItems, singleOrderItem] // AN ARRAY OF ORDER ITEMS
    subtotal += price * item.amount
  }

  // CALCULATE TOTAL
  const total = tax + shippingFee + subtotal

  // FAKE STRIPE PAYMENT INTENT
  const paymentIntent = await fakeStripeApi({ amount: total, currency: 'usd' })

  // CREATE FINAL ORDER
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userID,
  })

  // console.log(orderItems)
  // console.log(subtotal)
  res.status(StatusCodes.OK).json({ order, client_secret: order.clientSecret })
}

// UPDATE ORDER
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params

  const { paymentIntentId } = req.body

  const order = await Order.findOne({ _id: orderId })
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`)
  }
  checkPermissions(req.user, order.user)

  // ADDING PAYMENT INTENT ID AKA. PAID FOR THE ORDER
  order.paymentIntentId = paymentIntentId
  order.status = 'paid'
  await order.save()

  res.status(StatusCodes.OK).json({ order })
}

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
}
