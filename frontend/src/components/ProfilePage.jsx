// src/components/ProfilePage.jsx

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const TripsSpinner = () => (
	<div className="flex justify-center items-center py-8">
		<div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#ec6d13]"></div>
	</div>
);

// --- UPDATED DATE FORMATTER ---
const getOrdinal = (n) => {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatTripDates = (startDate, endDate, createdAt) => {
	// Fallback for old trips that don't have dates saved
	if (!startDate || !endDate) {
		if (!createdAt) return "Date not set";
		// Returns "November 2025" style for old trips
		return new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
	}

	const start = new Date(startDate);
	const end = new Date(endDate);

	const startDay = getOrdinal(start.getDate());
	const startMonth = start.toLocaleDateString("en-US", { month: "short" });

	const endDay = getOrdinal(end.getDate());
	const endMonth = end.toLocaleDateString("en-US", { month: "short" });

	const year = end.getFullYear();

	// Returns "2ndFeb - 5thFeb 2025"
	return `${startDay}${startMonth} - ${endDay}${endMonth} ${year}`;
};
// ------------------------------

const ProfilePage = () => {
	const location = useLocation();
	const [activeTab, setActiveTab] = useState(location.state?.defaultTab || "about");

	const [user, setUser] = useState(null);
	const [itineraries, setItineraries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [userRes, itineraryRes] = await Promise.all([fetch("http://localhost:3001/api/auth/me", { credentials: "include" }), fetch("http://localhost:3001/api/itinerary/history", { credentials: "include" })]);

				if (!userRes.ok) throw new Error(`Failed to fetch user data: ${userRes.statusText}`);
				const userData = await userRes.json();
				setUser(userData);
				if (!itineraryRes.ok) throw new Error(`Failed to fetch trip history: ${itineraryRes.statusText}`);
				const itineraryData = await itineraryRes.json();
				setItineraries(itineraryData);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const getTabClass = (tabName) => {
		const baseClasses = "py-3 px-6 text-base font-semibold transition duration-200";
		if (activeTab === tabName) {
			return `${baseClasses} text-[#ef5006] border-b-2 border-[#ef5006]`;
		}
		return `${baseClasses} text-gray-500 hover:text-gray-800`;
	};

	const handleDelete = async (itineraryId) => {
		const confirmDelete = window.confirm("Are you sure you want to delete this itinerary?");
		if (!confirmDelete) return;

		try {
			const response = await fetch(`http://localhost:3001/api/itinerary/${itineraryId}`, {
				method: "DELETE",
				credentials: "include",
			});

			const data = await response.json();
			if (response.ok) {
				setItineraries((prev) => prev.filter((item) => item._id !== itineraryId));
				alert("Itinerary deleted successfully!");
			} else {
				alert(data.error || "Failed to delete itinerary.");
			}
		} catch (error) {
			console.error("Error deleting itinerary:", error);
			alert("Something went wrong while deleting the itinerary.");
		}
	};

	return (
		<div className="flex flex-col items-center bg-gray-50 min-h-[calc(100vh-5rem)] py-12 px-4 font-display">
			<div className="flex flex-col items-center mb-10">
				{user ? (
					<>
						<div
							className="relative w-40 h-40 rounded-full bg-cover bg-center shadow-md"
							style={{ backgroundImage: `url(${user.profileImg || "./avatar.jpg"})` }}
						></div>
						<h1 className="text-3xl font-extrabold text-gray-900 mt-6 mb-1">{user.fullName}</h1>
						<p className="text-gray-500 text-lg mb-2">@{user.username}</p>
					</>
				) : (
					<div className="animate-pulse flex flex-col items-center">
						<div className="w-40 h-40 rounded-full bg-gray-300"></div>
						<div className="h-8 w-48 bg-gray-300 rounded mt-6 mb-1"></div>
						<div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
					</div>
				)}
			</div>

			<div className="flex justify-center border-b border-gray-200 w-full max-w-xl mb-8">
				<button
					className={getTabClass("about")}
					onClick={() => setActiveTab("about")}
				>
					About
				</button>
				<button
					className={getTabClass("trips")}
					onClick={() => setActiveTab("trips")}
				>
					Trips
				</button>
				<button
					className={getTabClass("saved")}
					onClick={() => setActiveTab("saved")}
				>
					Saved
				</button>
			</div>

			<div className="w-full max-w-4xl">
				{/* ABOUT TAB */}
				{activeTab === "about" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 max-w-xl mx-auto">
						<h2 className="text-xl font-bold text-gray-900 mb-5">About</h2>
						{user ? (
							<div className="space-y-1">
								<div className="flex items-center py-3 border-b border-gray-100">
									<p className="w-1/3 text-gray-500 text-sm">Username</p>
									<p className="w-2/3 text-gray-800 font-semibold">@{user.username}</p>
								</div>
								<div className="flex items-center py-3 border-b border-gray-100">
									<p className="w-1/3 text-gray-500 text-sm">Full Name</p>
									<p className="w-2/3 text-gray-800 font-semibold">{user.fullName}</p>
								</div>
								<div className="flex items-center py-3">
									<p className="w-1/3 text-gray-500 text-sm">Email</p>
									<p className="w-2/3 text-gray-800 font-semibold">{user.email}</p>
								</div>
							</div>
						) : (
							<p>Loading user data...</p>
						)}
					</div>
				)}

				{/* TRIPS TAB */}
				{activeTab === "trips" && (
					<div className="space-y-6">
						{loading && <TripsSpinner />}
						{error && <p className="text-center text-red-500">{error}</p>}
						{!loading && !error && (
							<>
								{itineraries.length > 0 ? (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{itineraries.map((itinerary) => (
											<div
												key={itinerary._id}
												className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-200/80 flex flex-col"
											>
												<div className="p-6 flex flex-col flex-grow">
													<div className="flex-grow">
														{/* Uses new date formatter */}
														<p className="text-sm font-semibold text-[#ec6d13] mb-2">{formatTripDates(itinerary.startDate, itinerary.endDate, itinerary.createdAt)}</p>
														<h3 className="text-2xl font-bold text-gray-800 mb-2">{itinerary.city}</h3>
														<p className="text-gray-600 mb-4">{itinerary.days} Day Trip</p>
													</div>

													<div className="flex items-center gap-3 mt-auto pt-4">
														<Link
															to="/itinerary"
															state={{ itineraryData: itinerary }}
															className="flex-1 text-center bg-[#ec6d13] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#d45f0f] transition-colors"
														>
															View
														</Link>

														<button
															onClick={() => handleDelete(itinerary._id)}
															className="flex-1 text-center bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
														>
															Delete
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200/80 max-w-xl mx-auto">
										<div className="w-96 h-72 mb-6 flex items-center justify-center">
											<img
												src="/EmptyBox.png"
												alt="No trips found"
												className="w-full h-full object-contain opacity-90"
											/>
										</div>

										<h3 className="text-xl font-bold text-gray-800 mb-2">No trips planned yet</h3>
										<p className="text-gray-500 mb-8 max-w-xs mx-auto">Your adventure awaits! Start planning your next journey now.</p>

										<Link
											to="/manual-plan"
											className="inline-block bg-[#ec6d13] text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-200 hover:bg-[#d45f0f] hover:shadow-xl transition-all transform hover:-translate-y-0.5"
										>
											Plan a New Trip
										</Link>
									</div>
								)}
							</>
						)}
					</div>
				)}

				{/* SAVED TAB */}
				{activeTab === "saved" && (
					<div className="space-y-6">
						{true ? (
							<div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200/80 max-w-xl mx-auto">
								<div className="w-96 h-72 mb-6 flex items-center justify-center">
									<img
										src="/SavedBox.png"
										alt="No saved places"
										className="w-full h-full object-contain opacity-90"
									/>
								</div>

								<h3 className="text-xl font-bold text-gray-800 mb-2">No saved places yet</h3>
								<p className="text-gray-500 mb-8 max-w-xs mx-auto">Found a spot you love? Save it here for your next adventure.</p>

								<Link
									to="/discover"
									className="inline-block bg-[#ec6d13] text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-200 hover:bg-[#d45f0f] hover:shadow-xl transition-all transform hover:-translate-y-0.5"
								>
									Discover Places
								</Link>
							</div>
						) : (
							<p>Saved items list goes here...</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ProfilePage;
