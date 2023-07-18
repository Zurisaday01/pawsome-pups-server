import express from 'express';

import {
	createCategory,
	getAllCategories,
	getCategory,
	updateCategory,
	deleteCategory,
} from '../controllers/categoryController.js';

import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router();

router
	.route('/')
	.post(protect, restrictTo('admin'), createCategory)
	.get(getAllCategories);

router
	.route('/:id')
	.get(getCategory)
	.patch(protect, restrictTo('admin'), updateCategory)
	.delete(protect, restrictTo('admin'), deleteCategory);

export default router;
