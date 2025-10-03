// routes/locationInfoRoute.js
import express from "express";
import { getCombinedLocationInfo } from "../controllers/locationInfoController.js";

const router = express.Router();

// GET /api/location-info/:placeId?userLat=x&userLng=y&destLat=a&destLng=b
router.get("/:placeId", getCombinedLocationInfo);

export default router;
