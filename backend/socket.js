import { parse as parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import Itinerary from "./models/Itinerary.js";
import User from "./models/User.js";
import { buildValidatedDaysPlan } from "./utils/itineraryDaysPlan.js";

const roomName = (itineraryId) => `itinerary:${itineraryId}`;

const broadcastPresence = async (io, room) => {
	const socketIds = await io.in(room).allSockets();
	io.to(room).emit("presence", { count: socketIds.size });
};

export const initSocket = (httpServer) => {
	const io = new Server(httpServer, {
		cors: {
			origin: ["http://localhost:5173", "http://localhost:3001", "https://trip-planner-lovat-psi.vercel.app"],
			credentials: true,
		},
	});

	io.use(async (socket, next) => {
		try {
			const cookies = parseCookie(socket.handshake.headers.cookie || "");
			const token = cookies.jwt;
			if (!token) return next(new Error("Unauthorized"));

			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			if (!decoded?.userId) return next(new Error("Unauthorized"));

			const user = await User.findById(decoded.userId).select("-password");
			if (!user) return next(new Error("Unauthorized"));

			socket.user = user;
			next();
		} catch (error) {
			next(new Error("Unauthorized"));
		}
	});

	io.on("connection", (socket) => {
		socket.on("join-itinerary", async ({ itineraryId }) => {
			try {
				if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
					return socket.emit("join-error", { error: "Invalid itinerary id" });
				}

				const itinerary = await Itinerary.findById(itineraryId).select("user");
				if (!itinerary) {
					return socket.emit("join-error", { error: "Itinerary not found" });
				}
				if (itinerary.user.toString() !== socket.user._id.toString()) {
					return socket.emit("join-error", { error: "Not authorized to edit this itinerary" });
				}

				const room = roomName(itineraryId);
				socket.itineraryRoom = room;
				socket.join(room);

				await broadcastPresence(io, room);
			} catch (error) {
				console.error("Error joining itinerary room:", error);
				socket.emit("join-error", { error: "Failed to join itinerary session" });
			}
		});

		socket.on("reorder-itinerary", async ({ itineraryId, daysPlan }) => {
			try {
				if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
					return socket.emit("reorder-error", { error: "Invalid itinerary id" });
				}
				if (socket.itineraryRoom !== roomName(itineraryId)) {
					return socket.emit("reorder-error", { error: "Join the itinerary session before editing" });
				}

				const itinerary = await Itinerary.findById(itineraryId);
				if (!itinerary) {
					return socket.emit("reorder-error", { error: "Itinerary not found" });
				}
				if (itinerary.user.toString() !== socket.user._id.toString()) {
					return socket.emit("reorder-error", { error: "Not authorized to edit this itinerary" });
				}

				const { newDaysPlan, error } = buildValidatedDaysPlan(itinerary, daysPlan);
				if (error) {
					return socket.emit("reorder-error", { error });
				}

				itinerary.daysPlan = newDaysPlan;
				itinerary.updatedAt = new Date();
				await itinerary.save();

				const populatedItinerary = await Itinerary.findById(itinerary._id).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

				io.to(socket.itineraryRoom).emit("itinerary-updated", {
					itineraryId,
					daysPlan: populatedItinerary.daysPlan,
				});
			} catch (error) {
				console.error("Error handling reorder-itinerary:", error);
				socket.emit("reorder-error", { error: "Failed to save changes" });
			}
		});

		socket.on("leave-itinerary", async () => {
			if (!socket.itineraryRoom) return;
			const room = socket.itineraryRoom;
			socket.leave(room);
			socket.itineraryRoom = null;
			await broadcastPresence(io, room);
		});

		socket.on("disconnect", async () => {
			if (!socket.itineraryRoom) return;
			await broadcastPresence(io, socket.itineraryRoom);
		});
	});

	return io;
};
