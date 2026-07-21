// src/components/PublicItineraryPage.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

const AttractionRow = ({ attraction }) => (
	<div className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
		<img
			src={attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523"}
			alt={attraction.name}
			className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
		/>
		<div>
			<h4 className="text-lg font-semibold text-gray-800">{attraction.name}</h4>
			<p className="text-sm text-gray-500">
				{attraction.opening_time || "N/A"} – {attraction.closing_time || "N/A"} · Entry: {attraction.entry_fee || "N/A"}
			</p>
		</div>
	</div>
);

const PublicItineraryPage = () => {
	const { token } = useParams();
	const [itinerary, setItinerary] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchPublicItinerary = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/api/itinerary/public/${token}`);
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Could not load this itinerary");
				setItinerary(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchPublicItinerary();
	}, [token]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingSpinner />
			</div>
		);
	}

	if (error || !itinerary) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-600">
				<p>{error || "This shared itinerary could not be found."}</p>
				<Link
					to="/"
					className="text-[#ef5006] font-semibold"
				>
					Go to Trip Planner
				</Link>
			</div>
		);
	}

	return (
		<div className="print:bg-white min-h-screen bg-[#f9fafb] py-8 px-4">
			<main className="print:shadow-none print:border-0 max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-[#DEE2E6] p-8">
				<div className="mb-6 flex items-center justify-between flex-wrap gap-2">
					<h1 className="text-3xl font-bold text-gray-800">{itinerary.city} Trip</h1>
					<div className="flex items-center gap-2">
						<span className="print:hidden text-sm font-semibold text-white bg-[#ef5006] px-3 py-1 rounded-full">Shared itinerary</span>
						<button
							onClick={() => window.print()}
							className="print:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Export PDF
						</button>
					</div>
				</div>
				<p className="text-gray-500 mb-8">
					A {itinerary.days}-day trip to {itinerary.city}. Sign up to build your own itinerary in minutes.
				</p>

				{(itinerary.daysPlan || []).map((dayData) => (
					<div
						key={dayData.day}
						className="mb-10"
					>
						<h2 className="text-2xl font-bold text-gray-800 mb-4">Day {dayData.day}</h2>

						{dayData.morning?.length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-bold text-gray-500 mb-2">Morning</h3>
								{dayData.morning.map((attraction) => (
									<AttractionRow
										key={attraction._id}
										attraction={attraction}
									/>
								))}
							</div>
						)}

						{dayData.evening?.length > 0 && (
							<div>
								<h3 className="text-lg font-bold text-gray-500 mb-2">Evening</h3>
								{dayData.evening.map((attraction) => (
									<AttractionRow
										key={attraction._id}
										attraction={attraction}
									/>
								))}
							</div>
						)}
					</div>
				))}

				<div className="print:hidden mt-8 text-center">
					<Link
						to="/"
						className="inline-block px-6 py-3 rounded-lg bg-[#ef5006] text-white font-bold shadow-lg shadow-[#ef5006]/30 hover:scale-105 transition-transform"
					>
						Plan your own trip
					</Link>
				</div>
			</main>
		</div>
	);
};

export default PublicItineraryPage;
