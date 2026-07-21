import express from "express";
import { generateItinerary, getItineraryHistory, deleteItinerary, shareItinerary, getPublicItinerary } from "../controllers/itineraryController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();
router.post("/", protectRoute, generateItinerary);
router.get("/history", protectRoute, getItineraryHistory);
router.get("/public/:shareToken", getPublicItinerary);
router.post("/:itineraryId/share", protectRoute, shareItinerary);
router.delete("/:itineraryId",protectRoute,deleteItinerary);


export default router;
