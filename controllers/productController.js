import Product from '../models/productModel.js';
import AppError from '../utils/appError.js';
import multer from 'multer';
import sharp from 'sharp';
import catchAsync from '../utils/catchAsync.js';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please upload only images.', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

export const uploadProductImages = upload.fields([
	{ name: 'imageCover', maxCount: 1 },
	{ name: 'images' },
]);
export const resizeProductImages = async (req, res, next) => {
	if (!req.files?.imageCover || !req.files?.images) return next();

	// STEP 1: cover image

	req.body.imageCover = `product-${req.body.name
		.toLowerCase()
		.replaceAll(' ', '-')}-${Date.now()}.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
		.resize(2000, 1333)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/products/${req.body.imageCover}`);

	// STEP 2: overview images
	req.body.images = [];

	await Promise.all(
		req.files.images.map(async (file, i) => {
			const filename = `product-${req.body.name
				.toLowerCase()
				.replaceAll(' ', '-')}-${Date.now()}-${i + 1}.jpeg`;

			await sharp(file.buffer)
				.resize(2000, 2500)
				.toFormat('jpeg')
				.jpeg({ quality: 90 })
				.toFile(`public/img/products/${filename}`);

			req.body.images.push(filename);
		})
	);

	next();
};

// POST /products
export const createProduct = catchAsync(async (req, res, next) => {
	const newProduct = await Product.create(req.body);
	res.status(201).json({
		status: 'success',
		data: {
			newProduct,
		},
	});
});

// GET /products
export const getAllProducts = catchAsync(async (req, res, next) => {
	const products = await Product.find({});

	res.status(200).json({
		status: 'success',
		results: products.length,
		data: {
			products,
		},
	});
});

// GET /products/:id
export const getProduct = catchAsync(async (req, res, next) => {
	const product = await Product.findById(req.params.id).populate('reviews'); //populate the reviews in the product

	if (!product) return next(new AppError('No product found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			product,
		},
	});
});

// PATCH /products/:id
export const updateProduct = catchAsync(async (req, res, next) => {
	const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!product) return next(new AppError('No product found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			product,
		},
	});
});

// DELETE /products/:id
export const deleteProduct = catchAsync(async (req, res, next) => {
	const product = await Product.findByIdAndDelete(req.params.id);

	if (!product) return next(new AppError('No product found with that ID', 404));

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
