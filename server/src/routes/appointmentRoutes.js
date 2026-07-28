import express from 'express';
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  getMyAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointmentController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// Public route to book an appointment
router.post(
    "/",
    protect,
    restrictTo("PATIENT"),
    createAppointment
);
router.get('/mine', protect, getMyAppointments);
router.get('/', protect, restrictTo('ADMIN', 'DOCTOR'), getAllAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, restrictTo('ADMIN', 'DOCTOR'), updateAppointmentStatus);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteAppointment);

export default router;
