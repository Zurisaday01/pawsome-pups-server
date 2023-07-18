import express from 'express';

const router = express.Router({ mergeParams: true });

import {
	getAllOrders,
	getMyOrders,
	getOrder,
	createOrder,
	updateOrderToPaid,
	updateOrderToDelivered,
	deleteOrder,
} from '../controllers/orderController.js';

import { protect, restrictTo } from '../controllers/authController.js';

router
	.route('/')
	.get(protect, restrictTo('admin'), getAllOrders)
	.post(protect, createOrder);

router.route('/myOrders').get(protect, getMyOrders);

router.route('/:id').get(getOrder).delete(protect, deleteOrder);

router.route('/:id/pay').patch(protect, updateOrderToPaid);

router
	.route('/:id/deliver')
	.patch(protect, restrictTo('admin'), updateOrderToDelivered);

export default router;
