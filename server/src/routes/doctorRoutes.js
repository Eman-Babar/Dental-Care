import express from "express";
import upload from "../config/multer.js";
import {
  getAssignedAppointments,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  upcomingAppointments,
  completedAppointments,
  getDoctorProfile,
  updateDoctorProfile,
  createDoctorService,
  deleteDoctorService,
  doctorDashboard,
  getMyPatients,
  getDoctorReviews,
} from "../controllers/doctorController.js";
import {
  listMyLeaves,
  createMyLeave,
  deleteMyLeave,
} from "../controllers/leaveController.js";
import {
  listMyQueue,
  updateTicketStatus,
  callNextTicket,
} from "../controllers/ticketController.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect, restrictTo("DOCTOR"));

router.get("/dashboard", doctorDashboard);
router.get("/appointments", getAssignedAppointments);
router.get("/upcoming", upcomingAppointments);
router.get("/completed", completedAppointments);
router.get("/patients", getMyPatients);
router.get("/reviews", getDoctorReviews);
router.put("/appointments/:id/approve", approveAppointment);
router.put("/appointments/:id/reject", rejectAppointment);
router.put("/appointments/:id/complete", completeAppointment);
router.get("/profile", getDoctorProfile);
router.put("/profile", upload.single("image"), updateDoctorProfile);
router.post("/services", createDoctorService);
router.delete("/services/:id", deleteDoctorService);

router.get("/leaves", listMyLeaves);
router.post("/leaves", createMyLeave);
router.delete("/leaves/:id", deleteMyLeave);

router.get("/queue", listMyQueue);
router.post("/queue/next", callNextTicket);
router.put("/queue/:id/status", updateTicketStatus);

export default router;
