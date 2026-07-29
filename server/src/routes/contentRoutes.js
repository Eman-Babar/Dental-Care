import express from "express";
import {
  getPublicContent,
  getAdminContent,
  updateContentItem,
  bulkUpdateContent,
} from "../controllers/contentController.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getPublicContent);

router.get("/admin", protect, restrictTo("ADMIN"), getAdminContent);
router.put("/admin/bulk", protect, restrictTo("ADMIN"), bulkUpdateContent);
router.put("/admin/:key", protect, restrictTo("ADMIN"), updateContentItem);

export default router;
