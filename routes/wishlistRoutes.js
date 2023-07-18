import express from 'express';

const router = express.Router();

import {
	getWishlist,
	createAndAddItemToWishlist,
	deleteAllItems,
	deleteItemInWishlist,
	updateQuantity,
} from '../controllers/wishlistController.js';

import { protect } from '../controllers/authController.js';

router.get('/', protect, getWishlist);
router.post('/add', protect, createAndAddItemToWishlist);
router.delete('/deleteAll', protect, deleteAllItems);
router.delete('/delete/:itemId', protect, deleteItemInWishlist);
router.patch('/updateQuantity/:itemId', protect, updateQuantity);

export default router;
