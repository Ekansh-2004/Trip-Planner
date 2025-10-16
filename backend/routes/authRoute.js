// import bcrypt from "bcryptjs";
// import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
// import User from "../models/User.js";

// export const register = async (req, res) => {
// 	try {
// 		const { name, email, password, userType } = req.body;

// 		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 		if (!emailRegex.test(email)) {
// 			return res.status(400).json({ error: "Invalid email format" });
// 		}

// 		const existingEmail = await User.findOne({ email });
// 		if (existingEmail) {
// 			return res.status(400).json({ error: "Email is already taken" });
// 		}

// 		if (password.length < 6) {
// 			return res.status(400).json({ error: "Password must be at least 6 characters long" });
// 		}

// 		const salt = await bcrypt.genSalt(10);
// 		const hashedPassword = await bcrypt.hash(password, salt);

// 		const newUser = new User({
// 			name,
// 			email,
// 			password: hashedPassword,
// 			userType,
// 		});

// 		if (newUser) {
// 			generateTokenAndSetCookie(newUser._id, res);
// 			await newUser.save();

// 			res.status(201).json({
// 				_id: newUser._id,
// 				name: newUser.name,
// 				email: newUser.email,
// 				userType: newUser.userType,
// 			});
// 		} else {
// 			res.status(400).json({ error: "Invalid user data" });
// 		}
// 	} catch (error) {
// 		console.log("Error in signup controller", error.message);
// 		return res.status(500).json({ error: "Internal Server Error" });
// 	}
// };
// // LOGIN FUNCTION - FIXED
// export const login = async (req, res) => {
// 	try {
// 		const { email, password } = req.body;

// 		const user = await User.findOne({ email });

// 		if (!user) {
// 			return res.status(400).json({ error: "Invalid email" }); // Added return
// 		}

// 		// Check whether the password submitted is equal to the password in the db
// 		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
// 		if (!isPasswordCorrect) {
// 			return res.status(400).json({ error: "Invalid Password" }); // Added return
// 		}

// 		generateTokenAndSetCookie(user._id, res);
// 		return res.status(201).json({
// 			// Added return (good practice)
// 			_id: user._id,
// 			name: user.name,
// 			email: user.email,
// 		});
// 	} catch (error) {
// 		console.log("Error in login controller", error.message);
// 		return res.status(500).json({ error: "Internal Server Error" }); // Added return
// 	}
// };
// // LOG OUT FUNCTION
// export const logout = async (req, res) => {
// 	try {
// 		res.cookie("jwt", "", { maxAge: 0 });
// 		res.status(200).json({ message: "Logout Out successfully" });
// 	} catch (error) {
// 		res.status(500).json({ error: "Internal Server Error" });
// 	}
// };

// // GET ME
// export const getMe = async (req, res) => {
// 	try {
// 		const user = await User.findById(req.user._id).select("-password");

// 		res.status(200).json(user);
// 	} catch (error) {
// 		console.error("Auth error:", error.message);
// 		res.status(500).json({ error: "Internal Server Error" });
// 	}
// };
