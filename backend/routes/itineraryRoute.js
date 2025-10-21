import express from "express";
import { generateItinerary, getItineraryHistory } from "../controllers/itineraryController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/", protectRoute, generateItinerary);
router.get("/history", protectRoute, getItineraryHistory);

export default router;
