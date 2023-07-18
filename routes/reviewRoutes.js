import express from 'express';

const router = express.Router({ mergeParams: true });

// POST /products/12312j31k23hiuhasd2a/reviews
// GET /products/12312j31k23hiuhasd2a/reviews
// POST /reviews

import {
	createReview,
	getAllReviews,
	getReview,
	updateReview,
	deleteReview,
} from '../controllers/reviewController.js';

import { protect } from '../controllers/authController.js';

router.route('/').get(getAllReviews).post(protect, createReview);

router
	.route('/:id')
	.get(protect, getReview)
	.patch(protect, updateReview)
	.delete(protect, deleteReview);

export default router;
