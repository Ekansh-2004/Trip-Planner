import express from "express";
import { getMe, login, logout, signup } from "../controllers/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// The 'protectRoute' middleware will run first to verify the user's token
router.get("/me", protectRoute, getMe);

// Route for user signup
router.post("/signup", signup);

// Route for user login
router.post("/login", login);

// Route for user logout
router.post("/logout", logout);

export default router;
