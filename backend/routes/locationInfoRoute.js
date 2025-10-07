import express from "express";
import { getCombinedLocationInfo } from "../controllers/locationInfoController.js";

const router = express.Router();

router.get("/:placeId", getCombinedLocationInfo);

export default router;
