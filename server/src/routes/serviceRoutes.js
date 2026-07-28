import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllServices);
router.get('/:id', getServiceById);

// Admin-only modifying routes with Multer image upload middleware
router.post('/', protect, restrictTo('ADMIN'), upload.single('image'), createService);
router.put('/:id', protect, restrictTo('ADMIN'), upload.single('image'), updateService);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteService);

export default router;
