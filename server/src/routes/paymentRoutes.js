import express from "express";
import {
  createCheckoutSession,
  confirmCheckoutSession,
  claimPayment,
  getPaymentConfig,
  getReceipt,
} from "../controllers/paymentController.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.get("/config", getPaymentConfig);

router.post(
  "/checkout",
  protect,
  restrictTo("PATIENT", "ADMIN"),
  createCheckoutSession
);
router.get(
  "/confirm",
  protect,
  restrictTo("PATIENT", "ADMIN"),
  confirmCheckoutSession
);
router.post(
  "/:appointmentId/claim",
  protect,
  restrictTo("PATIENT"),
  claimPayment
);
router.get(
  "/receipt/:appointmentId",
  protect,
  restrictTo("PATIENT", "ADMIN"),
  getReceipt
);

export default router;
