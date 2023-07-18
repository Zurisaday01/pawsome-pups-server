import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Order must belong to a user'],
		},
		items: [
			{
				productId: {
					type: String,
				},
				productName: {
					type: String,
					required: true,
				},
				imageCover: {
					type: String,
					required: true,
				},
				size: {
					type: String,
					required: true,
				},
				color: {
					type: String,
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
				},
				price: {
					type: Number,
					default: 0,
					required: true,
				},
				totalPrice: {
					type: Number,
					required: true,
				},
			},
		],
		shippingAddress: {
			type: String,
			required: true,
		},
		paymentMethod: {
			type: String,
			required: true,
		},
		paymentResult: {
			//it's the structure of the Paypal data
			id: {
				type: String,
			},
			status: {
				type: String,
			},
			update_time: {
				type: String,
			},
			email_address: {
				type: String,
			},
		},
		taxPrice: {
			type: Number,
			required: true,
			default: 0.0,
		},
		shippingPrice: {
			type: Number,
			required: true,
			default: 0.0,
		},
		totalPrice: {
			type: Number,
			required: true,
			default: 0.0,
		},
		isPaid: {
			type: Boolean,
			required: true,
			default: false,
		},
		paidAt: {
			type: Date,
			default: Date.now,
		},
		isDelivered: {
			type: Boolean,
			required: true,
			default: false,
		},
		deliveredAt: {
			type: Date,
		},
		createAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	}
);

orderSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'userId',
		model: 'User',
		select: 'name email',
	});

	next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

/*
- Product 
- Cart - populating product
- items - populating cart

*/
