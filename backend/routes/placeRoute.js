import express from "express";

import { getAllAttractions, getAttractionsByCity, getCoordinates, getNearbyHotels, getNearbyRestaurants } from "../controllers/placeController.js";
import { protectRoute } from "../middleware/protectRoute.js";
const router = express.Router();

router.post("/coordinates", protectRoute, getCoordinates);
router.post("/hotels", protectRoute, getNearbyHotels);
router.post("/restaurants", protectRoute, getNearbyRestaurants);
router.post("/attractions", protectRoute, getAllAttractions);
router.post("/by-city", protectRoute, getAttractionsByCity);

export default router;
