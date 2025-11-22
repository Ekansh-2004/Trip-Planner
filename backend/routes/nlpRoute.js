import express from "express";
import { analyzeTravelQuery } from "../controllers/nlpController.js";

const router = express.Router();


router.post("/analyze", analyzeTravelQuery);

export default router;
