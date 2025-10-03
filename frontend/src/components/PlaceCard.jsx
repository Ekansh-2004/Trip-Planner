import { useNavigate } from "react-router-dom";

const PlaceCard = ({ place, type, userLocation }) => {
	const navigate = useNavigate();

	const getTypeIcon = () => {
		switch (type) {
			case "hotels":
				return "🏨";
			case "restaurants":
				return "🍽️";
			case "attractions":
				return "🎯";
			default:
				return "📍";
		}
	};

	const handleCardClick = () => {
		// Navigate to place details page with data
		navigate(`/place/${place.placeId || Date.now()}`, {
			state: {
				place,
				type,
				userLocation,
			},
		});
	};

	return (
		<div
			className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer"
			onClick={handleCardClick}
		>
			<div className="p-6">
				<div className="flex justify-between items-start mb-4">
					<h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 flex-1">
						{getTypeIcon()}
						<span className="line-clamp-2">{place.name}</span>
					</h3>

					<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold ml-2 flex-shrink-0">{place.rating !== "N/A" ? `⭐ ${place.rating}` : "N/A"}</div>
				</div>

				<p className="text-gray-600 mb-4 flex items-center">
					<span className="mr-2">📍</span>
					{place.address}
				</p>

				{/* Distance if available */}
				{place.distance && <div className="text-sm text-gray-500">📏 {place.distance} km away</div>}

				<div className="mt-4 text-blue-600 text-sm font-medium">Click for details →</div>
			</div>
		</div>
	);
};

export default PlaceCard;
