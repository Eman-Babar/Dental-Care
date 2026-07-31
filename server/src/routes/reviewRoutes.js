import express from "express";
import { getPublicReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", getPublicReviews);

export default router;
