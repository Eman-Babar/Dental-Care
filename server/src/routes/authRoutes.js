import express from 'express';
import {
  register,
  registerDoctor,
  login,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/register-doctor', registerDoctor);
router.post('/login', login);
router.post('/logout', logout);

// Private routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
