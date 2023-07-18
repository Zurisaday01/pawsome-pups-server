import express from 'express';
import {
	createAddress,
	getAddress,
	updateAddress,
	deleteAddress,
} from '../controllers/addressController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router({ mergeParams: true });

// POST /users/12312j31k23hiuhasd2a/address
// GET /users/12312j31k23hiuhasd2a/address
// POST /address

router.route('/').post(protect, createAddress);

router
	.route('/:id')
	.get(protect, getAddress)
	.patch(protect, updateAddress)
	.delete(protect, deleteAddress);

export default router;
