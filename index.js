import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import colors from 'colors';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

// import connection MongoDB
import connectDB from './config/db.js';

// routes
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// configure the dotenv package
dotenv.config();

connectDB();

const app = express();

// Implement CORS
app.use(
	cors({
		origin: true,
		credentials: true,
	})
);

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}
// 300 request from the same IP in 1 hour = limit request from api
const limiter = rateLimit({
	max: 300,
	window: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour',
});

// url parse update user
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api', limiter);

app.use(express.json());

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
// 	res.header(
// 		'Access-Control-Allow-Methods',
// 		'GET,PUT,POST,DELETE,UPDATE,OPTIONS'
// 	);
// 	res.header('Access-Control-Allow-Origin', '*');
// 	res.header('Content-Type', 'application/json;charset=UTF-8');
// 	res.header('Access-Control-Allow-Credentials', true);
// 	res.header(
// 		'Access-Control-Allow-Headers',
// 		'Origin, X-Requested-With, Content-Type, Accept'
// 	);

// 	next();
// });s

// static files
app.use('/images', express.static('./public/img/products'));
app.use('/images', express.static('./public/img/users'));

// ROUTES
//URI versioning
app.use('/v1/users', userRoutes);
app.use('/v1/products', productRoutes);
app.use('/v1/reviews', reviewRoutes);
app.use('/v1/cart', cartRoutes);
app.use('/v1/wishlist', wishlistRoutes);
app.use('/v1/categories', categoryRoutes);
app.use('/v1/address', addressRoutes);
app.use('/v1/orders', orderRoutes);

app.all('*', (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error middleware
app.use(globalErrorHandler);

const port = process.env.PORT || 3000;

app.listen(
	port,
	console.log(
		`Server running in ${process.env.NODE_ENV} mode on port ${port}`
			.brightYellow.bold
	)
);
