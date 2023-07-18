import Review from '../models/reviewModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// POST /reviews
export const createReview = catchAsync(async (req, res, next) => {
	if (!req.body.userId) req.body.userId = req.user.id;

	const newReview = await Review.create(req.body);

	res.status(201).json({
		status: 'success',
		data: {
			newReview,
		},
	});
});

// GET /reviews
export const getAllReviews = catchAsync(async (req, res, next) => {
	const reviews = await Review.find({});

	res.status(200).json({
		status: 'success',
		results: reviews.length,
		data: {
			reviews,
		},
	});
});

// GET /reviews/:id
export const getReview = catchAsync(async (req, res, next) => {
	const review = await Review.findById(req.params.id);

	if (!review) return next(new AppError('No review found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			review,
		},
	});
});

// PATCH /reviews/:id
export const updateReview = catchAsync(async (req, res, next) => {
	const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!review) return next(new AppError('No review found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			review,
		},
	});
});

// DELETE /reviews/:id
export const deleteReview = catchAsync(async (req, res, next) => {
	const review = await Review.findByIdAndDelete(req.params.id);

	if (!review) return next(new AppError('No review found with that ID', 404));

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
