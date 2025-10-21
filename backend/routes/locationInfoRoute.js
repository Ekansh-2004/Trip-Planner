import express from "express";
import { getCombinedLocationInfo } from "../controllers/locationInfoController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:placeId", protectRoute, getCombinedLocationInfo);

export default router;
