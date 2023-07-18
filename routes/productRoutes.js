import express from 'express';

const router = express.Router();
import {
	uploadProductImages,
	resizeProductImages,
	createProduct,
	getAllProducts,
	getProduct,
	updateProduct,
	deleteProduct,
} from '../controllers/productController.js';

import {protect, restrictTo} from '../controllers/authController.js'

// route handlers
router
	.route('/')
	.get(getAllProducts)
	.post(protect, restrictTo('admin'), uploadProductImages, resizeProductImages, createProduct);

router
	.route('/:id')
	.get(getProduct)
	.patch(protect, restrictTo('admin'), uploadProductImages, resizeProductImages, updateProduct)
	.delete(protect, restrictTo('admin'), deleteProduct);

export default router;
