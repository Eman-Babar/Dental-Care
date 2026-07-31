import express from "express";
import { submitContactEnquiry } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", submitContactEnquiry);

export default router;
