const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Product rating is required'],
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Please provide review title'],
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, 'Please provide review text'],
    },

    // TIE USER TO REVIEW MODEL
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },

    // TIE PRODUCT TO REVIEW MODEL
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true }
)

// A USER CAN LEAVE ONLY SINGLE REVIEW FOR THE PRODUCT
reviewSchema.index({ product: 1, user: 1 }, { unique: true })

// AGGREGATE PIPELINE BASICALLY USED FOR RETURNING RESULTS FOR A GROUP OF DOCUMENTS, SCHEMA STATIC METHOD
// CALCULATE AVG.RATING AND NUM.0F.REVIEWS
reviewSchema.statics.calculateAverageRating = async function (productID) {
  const result = await this.aggregate([
    // $MATCH - FILTERS OUT REVIEWS WHERE PRODUCT_ID MATCHES THAT IN THE REVIEWS
    {
      $match: {
        product: productID,
      },
    },

    // $GROUP - TAKES OUTPUT FROM $MATCH AND USES AS IT'S INPUT FOR CALCULATING AVERAGE RATING AND NUM OF REVIEWS
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 },
      },
    },
  ])

  try {
    await this.model('Product').findOneAndUpdate(
      { _id: productID },
      {
        averageRating: Math.ceil(result[0]?.averageRating || 0),
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    )
  } catch (error) {
    console.log(error)
  }
  console.log(result)
}

// SEE CONSOLE LOGS WHILE YOU UPDATE OR DELETE A REVIEW, THESE HOOKS GET INVOKED BEFORE THE ACTUAL FUNCTIONALITY
// POST-SAVE HOOK
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product)
  console.log('post save hook called')
})

// POST-REMOVE HOOK
reviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product)
  console.log('post remove hook called')
})

module.exports = mongoose.model('Review', reviewSchema)
