import { useEffect, useRef, useState } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { io } from "socket.io-client";

// Shared by any page that loads a daysPlan and needs the drag-and-drop
// source-of-truth shape for it (lightweight — no lat/lng, just what the
// draggable cards need).
export const mapDaysPlanToAttractionsByDay = (daysPlan) => {
	const result = {};
	daysPlan.forEach((dayData, idx) => {
		const dayKey = `Day ${idx + 1}`;
		result[dayKey] = (dayData.attractions || []).map((attraction) => ({
			id: attraction._id,
			name: attraction.name,
			image: attraction.image,
			entry_fee: attraction.entry_fee,
			opening_time: attraction.opening_time,
			closing_time: attraction.closing_time,
		}));
	});
	return result;
};

// Drives the "Edit Order" live drag-and-drop experience: connects to the
// itinerary's socket room while editMode is on, receives live updates from
// other editors, and persists local drags (over the socket when connected,
// falling back to a direct REST PUT otherwise). Shared by the owner-only
// ItineraryPage and the share-link PublicItineraryPage — they differ only in
// how the socket join is authenticated (`joinPayload`, e.g. a shareToken for
// guests) and which REST endpoint the fallback PUT hits (`restEndpoint`).
export const useItineraryLiveEditing = ({ itineraryId, days, joinPayload = {}, restEndpoint }) => {
	const [editMode, setEditMode] = useState(false);
	const [attractionsByDay, setAttractionsByDay] = useState({});
	const [isSavingOrder, setIsSavingOrder] = useState(false);
	const [saveOrderStatus, setSaveOrderStatus] = useState(null);
	const [syncStatus, setSyncStatus] = useState("idle"); // idle | connecting | synced | error
	const socketRef = useRef(null);
	const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	useEffect(() => {
		if (!editMode || !itineraryId) return;

		setSyncStatus("connecting");
		const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
		socketRef.current = socket;

		socket.on("connect", () => {
			socket.emit("join-itinerary", { itineraryId, ...joinPayload });
		});

		socket.on("presence", () => {
			setSyncStatus("synced");
		});

		socket.on("join-error", (payload) => {
			console.error("Failed to join live edit session:", payload.error);
			setSyncStatus("error");
		});

		socket.on("itinerary-updated", (payload) => {
			setAttractionsByDay(mapDaysPlanToAttractionsByDay(payload.daysPlan));
		});

		socket.on("reorder-error", (payload) => {
			console.error("Reorder rejected by server:", payload.error);
			setSaveOrderStatus(payload.error || "Could not save that change.");
			setTimeout(() => setSaveOrderStatus(null), 4000);
		});

		socket.on("disconnect", () => setSyncStatus("idle"));
		socket.on("connect_error", () => setSyncStatus("error"));

		return () => {
			socket.emit("leave-itinerary");
			socket.disconnect();
			socketRef.current = null;
		};
		// joinPayload is passed fresh each render (it's a small object literal at
		// call sites) — only re-run this effect on the values that actually
		// identify a distinct edit session.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editMode, itineraryId]);

	const findDayContainingAttraction = (attractionId) => {
		if (attractionsByDay[attractionId]) return attractionId;
		return Object.keys(attractionsByDay).find((dayKey) => attractionsByDay[dayKey].some((a) => a.id === attractionId));
	};

	const persistDaysPlan = async (updatedAttractionsByDay) => {
		if (!itineraryId || !restEndpoint) return;

		const daysPlan = days.map((dayKey, idx) => ({
			day: idx + 1,
			attractions: (updatedAttractionsByDay[dayKey] || []).map((a) => a.id),
		}));

		const socket = socketRef.current;
		if (socket && socket.connected && syncStatus === "synced") {
			socket.emit("reorder-itinerary", { itineraryId, daysPlan });
			return;
		}

		setIsSavingOrder(true);
		try {
			const response = await fetch(restEndpoint, {
				method: "PUT",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ daysPlan }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Failed to save changes");
			setAttractionsByDay(mapDaysPlanToAttractionsByDay(data.itinerary));
		} catch (err) {
			console.error("Error saving itinerary order:", err);
			setSaveOrderStatus(err.message || "Could not save changes.");
			setTimeout(() => setSaveOrderStatus(null), 4000);
		} finally {
			setIsSavingOrder(false);
		}
	};

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (!over) return;

		const activeDayKey = findDayContainingAttraction(active.id);
		const overDayKey = findDayContainingAttraction(over.id) || over.id;
		if (!activeDayKey || !overDayKey || !attractionsByDay[overDayKey]) return;

		const activeItems = [...attractionsByDay[activeDayKey]];
		const activeIndex = activeItems.findIndex((a) => a.id === active.id);
		if (activeIndex === -1) return;

		let updated;
		if (activeDayKey === overDayKey) {
			const overIndex = activeItems.findIndex((a) => a.id === over.id);
			if (overIndex === -1 || overIndex === activeIndex) return;
			updated = { ...attractionsByDay, [activeDayKey]: arrayMove(activeItems, activeIndex, overIndex) };
		} else {
			const [movedAttraction] = activeItems.splice(activeIndex, 1);
			const overItems = [...attractionsByDay[overDayKey]];
			const overIndex = overItems.findIndex((a) => a.id === over.id);
			overItems.splice(overIndex === -1 ? overItems.length : overIndex, 0, movedAttraction);
			updated = { ...attractionsByDay, [activeDayKey]: activeItems, [overDayKey]: overItems };
		}

		setAttractionsByDay(updated);
		persistDaysPlan(updated);
	};

	return {
		editMode,
		setEditMode,
		attractionsByDay,
		setAttractionsByDay,
		isSavingOrder,
		saveOrderStatus,
		syncStatus,
		handleDragEnd,
		dndSensors,
	};
};
