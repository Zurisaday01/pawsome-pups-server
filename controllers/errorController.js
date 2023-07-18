import AppError from '../utils/AppError.js';

const handleCastErrorDB = err => {
	const message = `Invalid value (${err.value}) in ${err.path} `;

	return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
	// multiple validation errors
	const errors = Object.values(err.errors)
		.map(el => el.message)
		.join('. ');

	const message = `Invalid input data. ${errors}`;

	return new AppError(message, 400);
};

const handleJWTError = () =>
	new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
	new AppError('Your token has expired! Please log in again', 401);

const sendErrDev = (err, res) => {
	console.log(res);
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrProd = (err, res) => {
	// Operational errors
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
		// Progamming errors: don't leak error details
	} else {
		// 1) Log error
		console.log('Error', err);
		// 2) send generic message
		res.status(500).json({
			status: 'error',
			message: 'Something went very wrong',
		});
	}
};

// handler errors
export default (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		// in development send oll info to the dev
		sendErrDev(err, res);
	} else if (process.env.NODE_ENV === 'production') {
		// making a copy of the error
		let error = JSON.parse(JSON.stringify(err));

		if (error.name === 'CastError') error = handleCastErrorDB(error);
		// invalid values (you put restriction properties in the model)
		if (error.name === 'ValidationError')
			error = handleValidationErrorDB(error);
		// in case we don't insert a id valid = modified token
		if (error.name === 'JsonWebTokenError') error = handleJWTError();
		if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

		// in production send only error details to the user
		sendErrProd(error, res);
	}
};

/*
Errors mongoose

- CastError: mongoose failed to cast a value.
Converting one datatype into another 
the value you insert is not in the correct format or the field is empty

- 







*/
