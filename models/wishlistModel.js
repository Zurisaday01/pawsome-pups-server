import mongoose from 'mongoose';

const productItemSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
		},
		size: {
			type: String,
		},
		color: {
			type: String,
		},
		quantity: {
			type: Number,
			min: 1,
			default: 1,
			required: true,
		},
		price: {
			//product price
			type: Number,
			default: 0,
			required: true,
		},
		totalPrice: {
			// product price * quantity
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const wishlistSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'A wishlist must belong to a user'],
		},
		items: [productItemSchema],
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	}
);

wishlistSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'items',
		populate: {
			path: 'productId',
			model: 'Product',
			select: 'name',
		},
	});

	next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
