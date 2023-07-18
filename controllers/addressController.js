import Address from '../models/addressModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const createAddress = catchAsync(async (req, res, next) => {
	if (!req.body.userId) req.body.userId = req.user.id;

	const newAddress = await Address.create(req.body);

	res.status(201).json({
		status: 'success',
		data: {
			newAddress,
		},
	});
});

export const getAddress = catchAsync(async (req, res, next) => {
	const address = await Address.findById(req.params.id);

	if (!address) return next(new AppError('No address found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			address,
		},
	});
});

export const updateAddress = catchAsync(async (req, res, next) => {
	const address = await Address.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!address) {
		return next(new AppError('No address found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			address,
		},
	});
});

export const deleteAddress = catchAsync(async (req, res, next) => {
	await Address.findByIdAndDelete(req.params.id);

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
