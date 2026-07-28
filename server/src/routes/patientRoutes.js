import express from "express";

import {
  patientDashboard,
  getMyProfile,
  updateMyProfile,
  getMyAppointments,
  upcomingAppointments,
  appointmentHistory,
  cancelMyAppointment,
  rescheduleMyAppointment,
} from "../controllers/patientController.js";

import {
  getMyReviews,
  getReviewableAppointments,
  createReview,
} from "../controllers/reviewController.js";

import { patientChat } from "../controllers/chatController.js";

import { protect, restrictTo } from "../middlewares/auth.js";

import upload from "../config/multer.js";

const router = express.Router();

// Patient only
router.use(protect, restrictTo("PATIENT"));
router.get("/dashboard", patientDashboard);
router.get("/profile", getMyProfile);
router.get("/appointments", getMyAppointments);
router.get("/upcoming", upcomingAppointments);
router.get("/history", appointmentHistory);
router.put("/appointments/:id/cancel", cancelMyAppointment);
router.put("/appointments/:id/reschedule", rescheduleMyAppointment);
router.get("/reviews", getMyReviews);
router.get("/reviews/eligible", getReviewableAppointments);
router.post("/reviews", createReview);
router.post("/chat", patientChat);
router.put("/profile", upload.single("image"), updateMyProfile);

export default router;
