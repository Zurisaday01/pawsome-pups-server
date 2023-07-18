import mongoose from 'mongoose';
import Product from './productModel.js';

const reviewSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: [true, 'A review must belong to a product'],
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'A review must belong to a user'],
		},
		rating: {
			type: Number,
			min: 1,
			max: 5,
			required: [true, 'A review must be rated, 1 is the minimum value'],
		},
		review: {
			type: String,
			required: [true, 'A review must have content'],
		},
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	}
);

// used to perform pre Schema method operations.
reviewSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'userId',
		select: 'name photo',
	}).populate({
		path: 'productId',
		select: 'name',
	});

	next();
});

reviewSchema.statics.calcReviewsQuantity = async function (productId) {
	const stats = await this.aggregate([
		{
			$match: {
				productId: productId,
			},
		},
		{
			$group: {
				_id: '$productId',
				nReviews: { $sum: 1 },
			},
		},
	]);

	if (stats.length > 0) {
		await Product.updateOne(
			{ _id: productId },
			{ reviewsQuantity: stats[0].nReviews }
		);
	} else {
		await Product.updateOne({ _id: productId }, { reviewsQuantity: 0 });
	}
};

reviewSchema.statics.calcAverageRatings = async function (productId) {
	const stats = await this.aggregate([
		{
			$match: {
				productId: productId,
			},
		},
		{
			$group: {
				_id: '$productId',
				avgRating: { $avg: '$rating' },
			},
		},
	]);

	if (stats.length > 0) {
		// await Product.findOneAndUpdate(productId, {
		// 	ratingAverage: stats[0].avgRating,
		// });

		await Product.updateOne(
			{ _id: productId },
			{ ratingAverage: stats[0].avgRating }
		);
	} else {
		await Product.updateOne({ _id: productId }, { ratingAverage: 0 });
		// await Product.findByIdAndUpdate(productId, {
		// 	ratingAverage: 4.5,
		// });
	}
};

reviewSchema.post('save', function () {
	this.constructor.calcReviewsQuantity(this.productId);
	this.constructor.calcAverageRatings(this.productId);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
	this.review = await this.model.findOne(this.getQuery());

	next();
});

reviewSchema.post(/^findOneAnd/, async function () {
	await this.review.constructor.calcAverageRatings(this.review?.productId._id);
	await this.review.constructor.calcReviewsQuantity(
		this.product?.productId._id
	);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
