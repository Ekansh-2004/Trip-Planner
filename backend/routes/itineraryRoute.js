import express from "express";
import { generateItinerary, getItineraryHistory, deleteItinerary, shareItinerary, getPublicItinerary, updatePublicItinerary, updateItinerary } from "../controllers/itineraryController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();
router.post("/", protectRoute, generateItinerary);
router.get("/history", protectRoute, getItineraryHistory);
router.get("/public/:shareToken", getPublicItinerary);
router.put("/public/:shareToken", updatePublicItinerary);
router.post("/:itineraryId/share", protectRoute, shareItinerary);
router.put("/:itineraryId", protectRoute, updateItinerary);
router.delete("/:itineraryId",protectRoute,deleteItinerary);


export default router;
