import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: false, 
		sameSite: "lax", 
		path: "/",
		maxAge: 7 * 24 * 60 * 60 * 1000, 
	});
};
