import express from 'express';
import {
  register,
  registerDoctor,
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/register-doctor', registerDoctor); // disabled — returns 403
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
