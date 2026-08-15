import express from "express";
import { getQueueDisplay } from "../controllers/ticketController.js";

const router = express.Router();

router.get("/display", getQueueDisplay);

export default router;
