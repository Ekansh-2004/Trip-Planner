import express from "express";

import { protectRoute } from "../middleware/protectRoute.js";

import { getActivitiesByCity, getCuisinesByCity } from "../controllers/cultureController.js";

const router = express.Router();

router.get("/cuisine/:city", protectRoute, getCuisinesByCity);
router.get("/activities/:city", protectRoute, getActivitiesByCity);

export default router;
