// src/components/NearbyPlacesModal.jsx

import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

const NearbyPlacesModal = ({ type, lat, lng, city, userLocation, onClose }) => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			if (!lat || !lng || !city) {
				setError("Missing location data to search.");
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);
			try {
				const response = await axios.post(
					`${import.meta.env.VITE_API_URL}/api/places/${type}`,
					{
						lat,
						lng,
						radius: 5000,
						city: city,
					},
					{ withCredentials: true },
				);

				const results = response.data.data || response.data || [];

				const sortedResults = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

				setData(sortedResults);
			} catch (err) {
				console.error(`Failed to fetch ${type}:`, err);
				setError("Could not find places nearby. Please try again later.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [type, lat, lng, city]);

	const handleMoreDetails = (place) => {
		sessionStorage.setItem("itineraryScrollPos", window.scrollY);

		navigate(`/place/${place.placeId || Date.now()}`, {
			state: {
				place,
				type,
				userLocation,
			},
		});
		onClose();
	};

	const title = type === "hotels" ? "Nearby Hotels" : "Nearby Restaurants";

	return (
		// Modal Backdrop
		<div
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
		>
			{/* Modal Content */}
			<div
				onClick={(e) => e.stopPropagation()}
				className="bg-white rounded-2xl shadow-2xl w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl max-h-[80vh] flex flex-col"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-gray-200">
					<h3 className="text-2xl font-bold text-gray-800">{title}</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-700 transition-colors"
					>
						<svg
							className="w-7 h-7"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Body (Scrollable) */}
				<div className="overflow-y-auto p-5 space-y-3">
					{loading && <LoadingSpinner />}
					{error && <p className="text-center text-red-600">{error}</p>}

					{!loading && !error && data.length === 0 && <p className="text-center text-gray-500">No {type} found within 5km of the last location.</p>}

					{!loading &&
						!error &&
						data.length > 0 &&
						data.map((place) => (
							<div
								key={place.placeId || place.name}
								className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200"
							>
								<div className="flex-1">
									<h4 className="font-bold text-gray-800">{place.name}</h4>
									<div className="flex items-center gap-2 text-sm text-gray-500">
										<div className="flex items-center gap-1 text-yellow-500">
											<svg
												className="w-4 h-4"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
											<span className="font-semibold">{place.rating || "N/A"}</span>
										</div>
										{place.distance && <span>· {place.distance} km</span>}
									</div>
								</div>
								<button
									onClick={() => handleMoreDetails(place)}
									className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
								>
									More Details
								</button>
							</div>
						))}
				</div>
			</div>
		</div>
	);
};

export default NearbyPlacesModal;
