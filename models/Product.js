const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
      maxlength: [50, 'Name cannot be more than 50 characters.'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Price description is required'],
      maxlength: [1000, 'Description cannot be more than 1000 characters.'],
    },
    image: {
      type: String,
      default: '/uploads/example.jpg',
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: ['office', 'kitchen', 'bedroom'],
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      enum: {
        values: ['ikea', 'liddy', 'marcos'],
        message: '{VALUE} is not supported',
      },
    },
    colors: {
      type: [String],
      default: ['#222'],
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    inventory: {
      type: Number,
      required: true,
      default: 15,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    // TIE PRODUCT TO PARTICULAR USER
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// CONNECTING REVIEW MODEL WITH PRODUCT SCHEMA USING VIRTUAL
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
})

// DELETE REVIEWS ASSOCIATED WITH THE PRODUCT AS WELL
productSchema.pre('remove', async function () {
  await this.model('Review').deleteMany({ product: this._id })
})

module.exports = mongoose.model('Product', productSchema)
