import Order from '../models/orderModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Cart from '../models/cartModel.js';
import Address from '../models/addressModel.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose';

export const getAllOrders = catchAsync(async (req, res, next) => {
	const orders = await Order.find({});

	res.status(200).json({
		status: 'success',
		results: orders.length,
		data: {
			orders,
		},
	});
});

export const getMyOrders = catchAsync(async (req, res, next) => {
	const orders = await Order.find({ userId: req.user.id });

	res.status(200).json({
		status: 'success',
		results: orders.length,
		data: {
			orders,
		},
	});
});

export const getOrder = catchAsync(async (req, res, next) => {
	const order = await Order.findById(req.params.id);

	if (!order) {
		return next(new AppError('No order found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			order,
		},
	});
});

export const createOrder = catchAsync(async (req, res, next) => {
	if (!req.body.userId) req.body.userId = req.user.id;

	const currentCart = await Cart.find({ userId: req.user.id }).exec();
	const currentAddress = await Address.find({ userId: req.user.id }).exec();

	const { street, city, state, zipCode, country } = currentAddress[0];
	const shippingAddress = `${street}, ${city}, ${state}, ${zipCode}, ${country}`;
	req.body.shippingAddress = shippingAddress;

	const formatItems = currentCart[0].items.map(item => {
		return {
			productId: item.productId.id,
			productName: item.productId.name,
			imageCover: item.productId.imageCover,
			size: item.size,
			color: item.color,
			quantity: item.quantity,
			price: item.price,
			totalPrice: item.totalPrice,
		};
	});
	req.body.items = formatItems;

	const newOrder = await Order.create(req.body);

	res.status(200).json({
		status: 'success',
		data: {
			newOrder,
		},
	});
});

export const updateOrderToPaid = catchAsync(async (req, res, next) => {
	const order = await Order.findByIdAndUpdate(req.params.id);

	if (!order) {
		return next(new AppError('No order found with that ID', 404));
	}

	// updating
	order.isPaid = true;
	order.paidAt = Date.now();
	// the paymentResult comes from paypal, paypal returns an object when you pay
	order.paymentResult = {
		id: req.body.id,
		status: req.body.status,
		update_time: req.body.update_time,
		email_address: req.body.payer.email_address,
	};

	order.items.forEach(async item => {
		let productFromDB = await Product.findById(
			new mongoose.Types.ObjectId(item.productId)
		).exec();

		const variants = productFromDB.variants;

		const option = variants.find(
			option => option.size === item.size && option.color.at(0) === item.color
		);

		// STEP 1: when order is processed reduce quantity
		await Product.findOneAndUpdate(
			{ 'variants._id': option._id },
			{ $inc: { 'variants.$.countInStock': -item.quantity } }
		);
	});

	// STEP 2: when order is processed delete cart
	const currentCart = await Cart.find({ userId: req.user.id });
	await Cart.findByIdAndDelete(currentCart[0].id);

	// STEP 3: when order is processed if the address has isSaved property set to false delete it
	const currentAddress = await Address.find({ userId: req.user.id }).exec();

	const isSaved = currentAddress[0].isSaved;

	if (!isSaved) {
		await Address.findByIdAndDelete(currentAddress[0]._id);
	}

	const updatedOrder = await order.save();

	res.status(200).json({
		status: 'success',
		data: {
			order: updatedOrder,
		},
	});
});

export const updateOrderToDelivered = catchAsync(async (req, res, next) => {
	const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!order) {
		return next(new AppError('No order found with that ID', 404));
	}

	// updating
	order.isDelivered = true;
	order.deliveredAt = Date.now();

	const updatedOrder = await order.save();

	res.status(200).json({
		status: 'success',
		data: {
			order: updatedOrder,
		},
	});
});

export const deleteOrder = catchAsync(async (req, res, next) => {
	const order = await Order.findByIdAndDelete(req.params.id);

	if (!order) {
		return next(new AppError('No order found with that ID', 404));
	}

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
