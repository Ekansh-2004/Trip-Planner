import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: false, // true only in production (https)
		sameSite: "lax", // important for localhost
		path: "/",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
};
