import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

//SIGN UP FUNCTION
export const signup = async (req, res) => {
	try {
		const { fullName, username, email, password } = req.body;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email is already taken" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
			const newUser = new User({ fullName, username, email, password: hashedPassword });
			await newUser.save(); // important: save before issuing token
			generateTokenAndSetCookie(newUser._id, res);
			return res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// LOGIN IN FUNCTION
export const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		const user = await User.findOne({ username });

		if (!user) {
			return res.status(400).json({ error: "Invalid Username" });
		}
		//check whether the password submitted is equal to the password in the db
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
		if (!isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid Password" });
		}

		generateTokenAndSetCookie(user._id, res);
		res.status(201).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// LOG OUT FUNCTION
export const logout = async (req, res) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		
		if (isProduction) {
			// For production, clear with same attributes as when setting
			res.setHeader(
				'Set-Cookie',
				'jwt=; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0; Path=/'
			);
		} else {
			// For development
			res.clearCookie("jwt", {
				httpOnly: true,
				secure: false,
				sameSite: "lax",
				path: "/",
			});
		}

		return res.status(200).json({ message: "Logged out" });
	} catch (error) {
		console.log("Logout error:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

// GET ME
export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");

		res.status(200).json(user);
	} catch (error) {
		console.error("Auth error:", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};