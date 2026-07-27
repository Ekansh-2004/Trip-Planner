import mongoose from "mongoose";

const MORNING_COUNT = 3;

// Validates a client-submitted daysPlan against an itinerary's existing attraction
// set and returns the re-derived daysPlan ready to persist, or an error message.
// Shared between the REST PUT /api/itinerary/:id route and the reorder-itinerary
// socket event so the two entry points can't drift on validation rules. Only
// allows rearranging attractions the itinerary already has — every attraction id
// from the original itinerary must appear exactly once across the submitted days.
export const buildValidatedDaysPlan = (itinerary, daysPlan) => {
	if (!Array.isArray(daysPlan) || daysPlan.length === 0) {
		return { error: "daysPlan must be a non-empty array" };
	}
	if (daysPlan.length !== itinerary.days) {
		return { error: `daysPlan must contain exactly ${itinerary.days} day(s)` };
	}

	const existingAttractionIds = new Set(itinerary.daysPlan.flatMap((d) => d.attractions.map((id) => id.toString())));

	const seenIds = new Set();
	const newDaysPlan = [];

	for (let i = 0; i < daysPlan.length; i++) {
		const dayEntry = daysPlan[i];
		const dayNumber = Number(dayEntry.day);
		if (dayNumber !== i + 1) {
			return { error: "daysPlan entries must be ordered and numbered 1..N" };
		}

		const attractionIds = Array.isArray(dayEntry.attractions) ? dayEntry.attractions : [];

		for (const id of attractionIds) {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return { error: `Invalid attraction id: ${id}` };
			}
			if (!existingAttractionIds.has(id.toString())) {
				return { error: `Attraction ${id} does not belong to this itinerary` };
			}
			if (seenIds.has(id.toString())) {
				return { error: `Attraction ${id} appears more than once` };
			}
			seenIds.add(id.toString());
		}

		newDaysPlan.push({
			day: dayNumber,
			attractions: attractionIds,
			morning: attractionIds.slice(0, MORNING_COUNT),
			evening: attractionIds.slice(MORNING_COUNT),
			attractionCount: attractionIds.length,
		});
	}

	if (seenIds.size !== existingAttractionIds.size) {
		return { error: "daysPlan must include every attraction from the original itinerary exactly once" };
	}

	return { newDaysPlan };
};
