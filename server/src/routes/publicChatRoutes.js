import express from "express";
import { publicChat } from "../controllers/publicChatController.js";

const router = express.Router();

router.post("/", publicChat);

export default router;
