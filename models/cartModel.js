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

const cartSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'A cart must belong to a user'],
		},
		items: [productItemSchema],
		totalPrice: {
			type: Number,
			default: 0,
			required: true,
		},
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	}
);

cartSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'items',
		populate: {
			path: 'productId',
			model: 'Product',
			select: 'name imageCover',
		},
	});

	next();
});

cartSchema.statics.calcTotalPrice = async function (cartId) {
	const stats = await this.aggregate([
		{ $unwind: '$items' },
		{
			$group: {
				_id: 1,
				total_price: { $sum: '$items.totalPrice' },
			},
		},
	]).exec();

	if (stats.length > 0) {
		await Cart.updateOne({ _id: cartId }, { totalPrice: stats[0].total_price });
	} else {
		await Cart.updateOne({ _id: cartId }, { totalPrice: 0 });
	}
};

// DOCUMENT MIDLEWARE
//before the document is save in DB
// .save() .create()
//this is not called infinite times
cartSchema.post('save', function () {
	//this = current document being updated
	// this.constructor === Cart
	this.constructor.calcTotalPrice(this._id);
});

// findByIdAndUpdate - behind this is the same as findOneAndUpdate
// findByIdAndDelete
cartSchema.pre(/^findOneAnd/, async function (next) {
	this.cart = await this.model.findOne(this.getQuery());

	next();
});

// QUERY MIDDLEWARE
cartSchema.post(/^findOneAnd/, async function () {
	await this.cart.constructor.calcTotalPrice(this.cart._id);
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;

/*
{
    "productId": "64aebe8956a72ab7a3979fdf",
    "size": "S",
    "color": "Gray",
    "quantity": 1,
    "price": 8,
    "totalPrice": 32
}

{
    "productId": "64b1432d2d097684a97c2bca",
    "size": "L",
    "color": "Coffee",
    "quantity": 1,
    "price": 8,
    "totalPrice": 32
}

{
    "productId": "64b143e12d097684a97c2bd4",
    "size": "M",
    "color": "Blue",
    "quantity": 1,
    "price": 8,
    "totalPrice": 32
}
 */
