import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	// setting cookies
	res.cookie('jwt', token, {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
		sameSite: 'none', secure: true
	});

	// remove password from output
	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user: user,
		},
	});
};

export const signup = catchAsync(async (req, res, next) => {
	// the user cannot register as a admin
	const newUser = await User.create({
		...req.body,
		active: req.body.active,
		passwordChangedAt: req.body.passwordChangedAt,
	});

	createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	// 1. check if email and password exist
	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400));
	}
	// 2. Check if user exists && password is corrent
	const user = await User.findOne({ email }).select('+password').exec();

	// + To select the field that is by default not selected
	const correct = await user.correctPassword(password, user.password);

	if (!user || !correct) {
		return next(new AppError('Incorrect email or password', 401));
	}

	// 3. if everything is ok, send token to client
	createSendToken(user, 200, res);
});

export const logout = (req, res) => {
	// sending an almost expired cookie
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
		sameSite: 'none', secure: true
	});
	res.status(200).json({ status: 'success' });
};

export const protect = catchAsync(async (req, res, next) => {
	// Getting token and check whether it's there
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(
			new AppError('You are not logged in! Please sign in to get access', 401)
		);
	}

	// Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// Check is user still exists
	const freshUser = await User.findById(decoded.id);

	if (!freshUser) {
		return next(
			new AppError(
				'The user belonging to this token does no longer exists',
				401
			)
		);
	}

	// Check if user changed password after the token was issued
	if (freshUser.changedPasswordAfterUserCreated(decoded.iat)) {
		return next(
			new AppError('User recently changed password. Please sign in again', 401)
		);
	}

	// Go ahead, access to protected route
	req.user = freshUser;
	next();
});

// in this case we work with 2 roles: user, admin. Admin will have permissions
export const restrictTo = role => {
	return (req, res, next) => {
		if (role !== req.user.role) {
			return next(
				new AppError('You do not have permission to perform this action', 403)
			);
		}

		next();
	};
};

export const updatePassword = catchAsync(async (req, res, next) => {
	// get user by id
	const user = await User.findById(req.user.id).select('+password');

	// check if the password in the database and the POSTed password are the same
	if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
		return next(new AppError('Your current password is wrong.', 401));
	}

	// if so, update the password and save
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();

	// send new token
	createSendToken(user, 200, res);
});
