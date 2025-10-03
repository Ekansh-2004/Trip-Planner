import express from "express";

import { getAllAttractions, getCoordinates, getNearbyHotels, getNearbyRestaurants } from "../controllers/placeController.js";
const router = express.Router();

router.post("/coordinates", getCoordinates);
router.post("/hotels", getNearbyHotels);
router.post("/restaurants", getNearbyRestaurants);
router.post("/attractions", getAllAttractions);

export default router;
