import { getGroqClient } from "../utils/groqClient.js";
import Place from "../models/Place.js";

const VALID_CATEGORIES = ["hill_station", "beach", "religious", "adventure", "nature", "historical", "urban", "unknown"];
const VALID_BUDGET_TIERS = ["budget", "mid-range", "luxury"];
const VALID_GROUP_TYPES = ["solo", "couple", "family", "friends"];

const CATEGORY_KEYWORDS = {
	beach: ["beach"],
	religious: ["temple", "gurudwara", "mosque", "ashram", "shrine", "aarti", "cremation", "stupa", "monastery", "shaktipeeth", "sikh", "sacred", "holy"],
	historical: ["fort", "palace", "mausoleum", "museum", "monument", "haveli", "tomb", "mughal", "observatory", "unesco", "heritage", "railway station", "fortress"],
	adventure: ["adventure sports", "rafting", "bungee", "trek", "zipline", "water sports"],
	nature: ["garden", "lake", "wildlife", "waterfall", "national park", "sanctuary", "zoo", "viewpoint"],
	urban: ["shopping", "market", "cinema", "studio", "mall", "science centre", "planetarium"],
	hill_station: ["hilltop", "hill station", "hills"],
};

const SYSTEM_PROMPT = `You are a travel query parser for an Indian trip-planning app. Given a free-text description of a trip, extract structured information as JSON.

Return ONLY a JSON object with exactly these fields:
{
  "destination_type": one of ${JSON.stringify(VALID_CATEGORIES)},
  "city": string or null (a specific city/destination the user named, e.g. "Jaipur"; null if none was named),
  "duration_days": integer or null (trip length in days, if mentioned),
  "budget_tier": one of ${JSON.stringify(VALID_BUDGET_TIERS)} or null,
  "group_type": one of ${JSON.stringify(VALID_GROUP_TYPES)} or null,
  "interests": array of short strings describing interests/activities mentioned (empty array if none),
  "season": string or null (a season, month, or time-of-year if mentioned)
}

Use "unknown" for destination_type only if the text gives no usable travel signal at all. Respond with the JSON object only, no other text.`;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Ranks cities that actually have attraction data in MongoDB, by counting Place
// documents whose `feature` text matches the category's keywords (plus any
// user-stated interests). This keeps suggestions groundable — every city
// returned here is guaranteed to have attractions for itinerary generation.
const getGroundedSuggestions = async (category, interests) => {
	const categoryKeywords = CATEGORY_KEYWORDS[category] || [];
	const interestKeywords = (interests || []).map((i) => i.trim()).filter(Boolean);
	const keywords = [...categoryKeywords, ...interestKeywords];

	if (keywords.length === 0) return [];

	const regexes = keywords.map((k) => new RegExp(escapeRegex(k), "i"));

	const ranked = await Place.aggregate([
		{ $match: { feature: { $in: regexes } } },
		{ $group: { _id: "$city", matchCount: { $sum: 1 } } },
		{ $sort: { matchCount: -1 } },
		{ $limit: 5 },
	]);

	return ranked.map((r) => r._id);
};

const findCityInDB = async (cityHint) => {
	if (!cityHint) return null;
	const match = await Place.findOne({ city: { $regex: `^${escapeRegex(cityHint)}$`, $options: "i" } }).select("city");
	return match ? match.city : null;
};

export const analyzeTravelQuery = async (req, res) => {
	try {
		const { text } = req.body;
		if (!text) return res.status(400).json({ error: "No text provided" });

		const completion = await getGroqClient().chat.completions.create({
			model: "llama-3.3-70b-versatile",
			temperature: 0,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: text },
			],
		});

		const raw = completion.choices?.[0]?.message?.content;
		if (!raw) {
			return res.status(502).json({ error: "No response from language model" });
		}

		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch (parseErr) {
			console.error("Failed to parse Groq JSON response:", raw);
			return res.status(502).json({ error: "Language model returned malformed JSON" });
		}

		const category = VALID_CATEGORIES.includes(parsed.destination_type) ? parsed.destination_type : "unknown";

		const extracted = {
			city: typeof parsed.city === "string" && parsed.city.trim() ? parsed.city.trim() : null,
			duration_days: Number.isInteger(parsed.duration_days) ? parsed.duration_days : null,
			budget_tier: VALID_BUDGET_TIERS.includes(parsed.budget_tier) ? parsed.budget_tier : null,
			group_type: VALID_GROUP_TYPES.includes(parsed.group_type) ? parsed.group_type : null,
			interests: Array.isArray(parsed.interests) ? parsed.interests.filter((i) => typeof i === "string") : [],
			season: typeof parsed.season === "string" && parsed.season.trim() ? parsed.season.trim() : null,
		};

		const namedCity = await findCityInDB(extracted.city);
		const categorySuggestions = await getGroundedSuggestions(category, extracted.interests);

		const suggestions = [...new Set([...(namedCity ? [namedCity] : []), ...categorySuggestions])].slice(0, 5);

		if (suggestions.length > 0) {
			const message = namedCity
				? `${namedCity} has attractions in our database that match your trip — here's where to start:`
				: `Here are some popular ${category.replace("_", " ")} destinations we have itinerary data for:`;

			return res.json({
				user_input: text,
				detected_category: category,
				extracted,
				message,
				suggestions,
			});
		}

		return res.json({
			user_input: text,
			detected_category: category,
			extracted,
			message: "We don't have matching destinations in our database yet for that request.",
			suggestions: [],
		});
	} catch (error) {
		console.error("Error in NLP route:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
