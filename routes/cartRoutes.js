import express from 'express';

const router = express.Router();

import {
	getCart,
	createAndAddItemToCart,
	deleteAllItems,
	deleteItemInCart,
	updateQuantity,
} from '../controllers/cartController.js';
import { protect } from '../controllers/authController.js';

router.get('/', protect, getCart);
router.post('/add', protect, createAndAddItemToCart);
router.delete('/deleteAll', protect, deleteAllItems);
router.delete('/delete/:itemId', protect, deleteItemInCart);
router.patch('/updateQuantity/:itemId', protect, updateQuantity);

export default router;
