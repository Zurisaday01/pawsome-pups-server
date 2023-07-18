import express from 'express';
const router = express.Router();

import {
	uploadUserPhoto,
	resizeUserPhoto,
	getAllUsers,
	createUser,
	getUser,
	updateUser,
	yourProfile,
	deleteUserProfile,
	updateUserProfile,
	deleteUser,
} from '../controllers/userController.js';

import {
	protect,
	restrictTo,
	signup,
	login,
	logout,
	updatePassword,
} from '../controllers/authController.js';

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.get('/yourProfile', protect, yourProfile, getUser);
router.patch(
	'/updateProfile',
	protect,
	uploadUserPhoto,
	resizeUserPhoto,
	updateUserProfile
);
router.patch('/updateMyPassword', protect, updatePassword);
router.delete('/deleteProfile', protect, deleteUserProfile);

router
	.route('/')
	.get(protect, restrictTo('admin'), getAllUsers)
	.post(protect, restrictTo('admin'), createUser);

router
	.route('/:id')
	.get(protect, restrictTo('admin'), getUser)
	.patch(protect, restrictTo('admin'), updateUser)
	.delete(protect, restrictTo('admin'), deleteUser);

export default router;
