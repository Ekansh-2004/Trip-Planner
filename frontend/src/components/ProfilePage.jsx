import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Loading spinner for the trips tab
const TripsSpinner = () => (
	<div className="flex justify-center items-center py-8">
		<div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#ec6d13]"></div>
	</div>
);

// Formats a date string into a more readable format, e.g., "October 2025"
const formatDate = (dateString) => {
	if (!dateString) return "Date not set";
	const options = { year: "numeric", month: "long" };
	return new Date(dateString).toLocaleDateString("en-US", options);
};

const ProfilePage = () => {
	const [activeTab, setActiveTab] = useState("trips");
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
		const baseClasses = "border-b-2 px-1 py-4 text-sm font-bold transition-colors";
		if (activeTab === tabName) {
			return `${baseClasses} border-[#ec6d13] text-[#ec6d13]`;
		}
		return `${baseClasses} border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800`;
	};

	return (
		<div className="bg-[#f8f7f6] min-h-[calc(100vh-5rem)] py-8 font-display">
			{/* Profile Header section */}
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center gap-6 pb-8 text-center">
					{user ? (
						<>
							<div
								className="relative size-32 rounded-full bg-cover bg-center shadow-lg border-4 border-white"
								style={{ backgroundImage: `url(${user.profileImg || "./avatar.jpg"}` }}
							></div>
							<div>
								<h2 className="text-3xl font-bold text-[#221810]">{user.fullName}</h2>
								<p className="text-[#221810]/60">@{user.username}</p>
							</div>
						</>
					) : (
						<div className="h-44 animate-pulse flex flex-col items-center gap-6">
							<div className="size-32 rounded-full bg-gray-300"></div>
							<div className="h-8 w-48 bg-gray-300 rounded"></div>
						</div>
					)}
					<button className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-bold text-[#221810] transition-colors hover:bg-gray-200">Edit Profile</button>
				</div>
			</div>

			{/* Tab Navigation section */}
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex justify-center space-x-8">
					<button
						onClick={() => setActiveTab("trips")}
						className={getTabClass("trips")}
					>
						My Trips
					</button>
					<button
						onClick={() => setActiveTab("about")}
						className={getTabClass("about")}
					>
						About
					</button>
					<button
						onClick={() => setActiveTab("saved")}
						className={getTabClass("saved")}
					>
						Saved Places
					</button>
				</nav>
			</div>

			{/* Tab Content section */}
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				<div className="py-10">
					{/* ... (About and Saved tabs remain the same) ... */}

					{activeTab === "trips" && (
						<section className="space-y-8">
							<h3 className="px-4 text-xl font-bold text-[#221810]">My Trip History</h3>
							{loading && <TripsSpinner />}
							{error && <p className="text-center text-red-500">{error}</p>}
							{!loading && !error && (
								<>
									{itineraries.length > 0 ? (
										<div className="grid gap-8 md:grid-cols-2">
											{itineraries.map((itinerary) => (
												<div
													key={itinerary._id}
													className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
												>
													<div className="p-6">
														<p className="text-sm font-semibold text-[#ec6d13] mb-2">{formatDate(itinerary.createdAt)}</p>
														<h3 className="text-2xl font-bold text-gray-800 mb-2">{itinerary.city}</h3>
														<p className="text-gray-600 mb-4">{itinerary.days} Day Trip</p>
														<Link
															to="/itinerary"
															state={{ itineraryData: itinerary }} // Pass the whole itinerary object
															className="inline-block bg-[#ec6d13] text-white font-bold px-6 py-2 rounded-lg hover:bg-[#d45f0f] transition-colors"
														>
															View Itinerary
														</Link>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-12 bg-white rounded-xl shadow-md">
											<p className="text-gray-600">You haven't planned any trips yet.</p>
											<Link
												to="/manual-plan"
												className="mt-4 inline-block bg-[#ec6d13] text-white font-bold px-6 py-2 rounded-lg hover:bg-[#d45f0f] transition-colors"
											>
												Plan a New Trip
											</Link>
										</div>
									)}
								</>
							)}
						</section>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProfilePage;
