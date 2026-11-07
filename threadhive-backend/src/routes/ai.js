import express from "express";
import { rephrase } from "../controllers/aiController.js";
import authHandler from "../middleware/authHandler.js";

const router = express.Router();

router.post("/rephrase", authHandler, rephrase);

export default router;
