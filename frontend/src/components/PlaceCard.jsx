// src/components/PlaceCard.jsx
import { useNavigate } from "react-router-dom";

// Using the new UI but keeping the original, functional props
const PlaceCard = ({ place, type, userLocation }) => {
	const navigate = useNavigate();

	const handleCardClick = () => {
		// This navigation logic remains the same
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
			className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group border border-[#DEE2E6] hover:border-[#FF6B35] cursor-pointer flex flex-col"
			onClick={handleCardClick}
		>
			{/* Image section has been removed */}

			<div className="p-5 flex flex-col flex-grow">
				<h3 className="text-xl font-bold text-[#212529] mb-2">{place.name}</h3>

				{/* Address is no longer truncated */}
				<p className="text-[#6C757D] mt-1 text-sm flex-grow">{place.address}</p>

				{/* Container for bottom details */}
				<div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
					{/* Rating badge is now here */}
					<div className="bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
						<span className="material-symbols-outlined !text-sm">star</span>
						{place.rating !== "N/A" ? place.rating : "New"}
					</div>

					<p className="text-sm font-medium text-[#6C757D]">{place.distance} km away</p>
				</div>
			</div>
		</div>
	);
};

export default PlaceCard;