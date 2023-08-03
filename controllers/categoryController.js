import Category from '../models/categoryModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// POST /categories
export const createCategory = catchAsync(async (req, res, next) => {
	const newCategory = await Category.create(req.body);

	res.status(201).json({
		status: 'success',
		data: {
			newCategory,
		},
	});
});

// GET /categories
export const getAllCategories = catchAsync(async (req, res, next) => {
	const categories = await Category.find({});

	res.status(200).json({
		status: 'success',
		results: categories.length,
		data: {
			categories,
		},
	});
});

// GET /categories/:id
export const getCategory = catchAsync(async (req, res, next) => {
	const category = await Category.findById(req.params.id).populate('products');

	if (!category)
		return next(new AppError('No category found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			category,
		},
	});
});

export const updateCategory = catchAsync(async (req, res, next) => {
	const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!category) {
		return next(new AppError('No category found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			category,
		},
	});
});

// DELETE categories/:id
export const deleteCategory = catchAsync(async (req, res, next) => {
	await Category.findByIdAndDelete(req.params.id);

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
