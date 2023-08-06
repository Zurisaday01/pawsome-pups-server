import Cart from '../models/cartModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

export const getCart = catchAsync(async (req, res, next) => {
	const currentCart = await Cart.find({ userId: req.user.id }).exec();

	if (!currentCart[0] || currentCart?.[0]?.items?.length === 0)
		return res.status(200).json({
			status: 'success',
			results: 0,
			message: 'There are not items in cart',
		});

	res.status(200).json({
		status: 'success',
		results: currentCart?.[0]?.items?.length,
		data: {
			cart: currentCart[0],
		},
	});
});

// delete all the items from cart in User instance will be " cart: []  "
// DELETE /delete
export const deleteAllItems = catchAsync(async (req, res, next) => {
	// STEP 1: find the current cart
	const currentCart = await Cart.find({ userId: req.user.id });

	// STEP 2: get the cart's id
	const cartId = currentCart[0].id;

	// STEP 3: using the cart's id delete the cart
	await Cart.findByIdAndDelete(cartId);

	res.status(200).json({
		status: 'success',
	});
});

// add one single item to cat
// POST /add
export const createAndAddItemToCart = catchAsync(async (req, res, next) => {
	if (!req.body.userId) req.body.userId = req.user.id;

	const currentUser = await User.findById(req.user.id).populate('cart');

	let items = [];
	if (!currentUser.cart) {
		items.push(req.body);

		const newCart = { userId: req.body.userId, items };

		await Cart.create(newCart);
	}

	if (currentUser.cart) {
		const currentCart = await Cart.findById(currentUser.cart.id);

		const productFromDB = await Product.findById(req.body.productId).exec();

		if (!productFromDB)
			return next(new AppError('No product found with that ID', 404));

		const variants = productFromDB.variants;

		const option = variants.find(
			option =>
				option.size === req.body.size && option.color[0] === req.body.color
		);
		/*

		// NOTE: when order is processed reduce quantity
		await Product.findOneAndUpdate(
			{ 'variants._id': option.id },
			{ $inc: { 'variants.$.countInStock': -req.body.quantity } }
		);

		const target = await Product.findOne({ 'variants._id': option.id });
		console.log(target);

		*/
		if (!option) return next(new AppError('No option available', 400));

		let validationProductAdded = false;
		currentCart.items.forEach(item => {
			if (item.productId.id === req.body.productId && item.size === req.body.size)
				validationProductAdded = true;
		});

		if (validationProductAdded)
			return next(
				new AppError('You already added this product to your cart!!', 400)
			);

		await Cart.findOneAndUpdate(
			{ _id: currentUser.cart.id },
			{ $push: { items: req.body } }
		);
	}

	res.status(200).json({
		status: 'success',
	});
});

// delete onse single item from cart
export const deleteItemInCart = catchAsync(async (req, res, next) => {
	const currentCart = await Cart.find({ userId: req.user.id });

	const item = await Cart.findOneAndUpdate(
		{ _id: currentCart[0].id },
		{ $pull: { items: { _id: req.params.itemId } } }
	);

	if (!item) return next(new AppError('No item found with that ID', 404));

	res.status(200).json({
		status: 'success',
	});
});

export const updateQuantity = catchAsync(async (req, res, next) => {
	const item = await Cart.findOneAndUpdate(
		{ 'items._id': req.params.itemId },
		{ $set: { 'items.$.quantity': req.body.quantity } }
	);

	if (!item) return next(new AppError('No item found with that ID', 404));

	res.status(200).json({
		status: 'success',
	});
});
