import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

	const isProduction = process.env.NODE_ENV === "production";

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: isProduction, 
		sameSite: isProduction ? "none" : "lax", 
		path: "/",
		maxAge: 15 * 24 * 60 * 60 * 1000,
	});
};
