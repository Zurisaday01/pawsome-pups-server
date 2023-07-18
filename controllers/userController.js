import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';
import multer from 'multer';
import sharp from 'sharp';

// Filter users by role (user, admin)
// sort by name

const multerStorage = multer.memoryStorage();

const multerFileter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please upload only images.', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFileter,
});

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(async (req, file, next) => {
	if (!req.file) return next();

	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`);

	next();
});

const filterObj = (obj, ...allowedFields) => {
	const newObj = {};

	Object.keys(obj).forEach(el => {
		if (allowedFields.includes(el)) newObj[el] = obj[el];
	});

	return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
	const queryObj = { ...req.query };
	const excludedFields = ['page', 'sort', 'role', 'limit'];
	excludedFields.forEach(el => delete queryObj[el]);

	const users = await User.find(queryObj);

	res.status(200).json({
		status: 'success',
		results: users.length,
		data: {
			users,
		},
	});
});

export const createUser = catchAsync(async (req, res, next) => {
	const newUser = await User.create({ ...req.body });
	res.status(201).json({
		status: 'success',
		data: {
			user: newUser,
		},
	});
	// const newUser = await User.create(req.body)
});

// GET /users/:id
export const getUser = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id)
		.populate('cart')
		.populate('wishlist')
		.populate('address'); //populate the cart and wishlist in the product

	if (!user) return next(new AppError('No user found with that ID', 404));

	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	});
});

export const updateUser = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		// runValidators: true,
	});

	if (!user) {
		return next(new AppError('No user found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	});
});

// DELETE /users/:id
export const deleteUser = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.params.id, { active: false });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

// ------------------------
// ---- Authorization -----
// ------------------------

export const yourProfile = catchAsync(async (req, res, next) => {
	req.params.id = req.user.id;
	next();
});

export const deleteUserProfile = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });

	// sending an almost expired cookie
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

// PATCH
export const updateUserProfile = catchAsync(async (req, res, next) => {
	// create error if user tries to POST password or passwordConfirm
	if (req.body.password || req.body.passwordConfirm) {
		return next(
			new AppError(
				'This route is not for password updates. Please use /updateMyPassword',
				400
			)
		);
	}

	// filter the req.body {}, to return req.body{'name', 'email'}
	const filteredBody = filterObj(req.body, 'name', 'email');

	if (req.file) filteredBody.photo = req.file.filename;
	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		// runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser,
		},
	});
});
