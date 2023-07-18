import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Wishlist from '../models/wishlistModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const getWishlist = catchAsync(async (req, res, next) => {
	const currentWishlist = await Wishlist.find({ userId: req.user.id }).exec();

	if (!currentWishlist[0] || currentWishlist?.[0]?.items?.length === 0)
		return res.status(200).json({
			status: 'success',
			results: 0,
			message: 'There are not items in wishlist',
		});

	res.status(200).json({
		status: 'success',
		result: currentWishlist?.[0]?.items?.length,
		data: {
			wishlist: currentWishlist[0],
		},
	});
});

// DELETE /delete
export const deleteAllItems = catchAsync(async (req, res, next) => {
	const currentWishlist = await Wishlist.find({ userId: req.user.id });

	const wishlistId = currentWishlist[0].id;

	await Wishlist.findByIdAndDelete(wishlistId);

	res.status(200).json({
		status: 'success',
	});
});

// POST /add
export const createAndAddItemToWishlist = catchAsync(async (req, res, next) => {
	if (!req.body.userId) req.body.userId = req.user.id;

	const currentUser = await User.findById(req.user.id).populate('wishlist');

	let items = [];
	if (!currentUser.wishlist) {
		items.push(req.body);

		const newWishlist = { userId: req.body.userId, items };

		await Wishlist.create(newWishlist);
	}

	if (currentUser.wishlist) {
		const currentWishlist = await Wishlist.findById(currentUser.wishlist.id);

		const productFromDB = await Product.findById(req.body.productId).exec();

		if (!productFromDB)
			return next(new AppError('No product found with that ID', 404));

		const variants = productFromDB.variants;

		const option = variants.find(
			option =>
				option.size === req.body.size && option.color.at(0) === req.body.color
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
		currentWishlist.items.forEach(item => {
			if (item.productId.id === req.body.productId)
				validationProductAdded = true;
		});

		if (validationProductAdded)
			return next(
				new AppError('You already added this product to your wishlist!!', 400)
			);

		await Wishlist.findOneAndUpdate(
			{ _id: currentUser.wishlist.id },
			{ $push: { items: req.body } }
		);
	}

	res.status(200).json({
		status: 'success',
	});
});

// delete onse single item from wishlist
export const deleteItemInWishlist = catchAsync(async (req, res, next) => {
	const currentWishlist = await Wishlist.find({ userId: req.user.id });

	const item = await Wishlist.findOneAndUpdate(
		{ _id: currentWishlist[0].id },
		{ $pull: { items: { _id: req.params.itemId } } }
	);

	if (!item) return next(new AppError('No item found with that ID', 404));

	res.status(200).json({
		status: 'success',
	});
});

export const updateQuantity = catchAsync(async (req, res, next) => {
	const item = await Wishlist.findOneAndUpdate(
		{ 'items._id': req.params.itemId },
		{ $set: { 'items.$.quantity': req.body.quantity } }
	);

	if (!item) return next(new AppError('No item found with that ID', 404));

	res.status(200).json({
		status: 'success',
	});
});
