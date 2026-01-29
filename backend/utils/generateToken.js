import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

	const isProduction = process.env.NODE_ENV === "production";

	if (isProduction) {
		const maxAge = 15 * 24 * 60 * 60;
		res.setHeader("Set-Cookie", `jwt=${token}; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${maxAge}; Path=/`);
	} else {
		res.cookie("jwt", token, {
			httpOnly: true,
			secure: false,
			sameSite: "lax",
			path: "/",
			maxAge: 15 * 24 * 60 * 60 * 1000,
		});
	}
};
