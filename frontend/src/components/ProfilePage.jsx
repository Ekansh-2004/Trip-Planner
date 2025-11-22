

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const TripsSpinner = () => (
	<div className="flex justify-center items-center py-8">
		<div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#ec6d13]"></div>
	</div>
);

const formatDate = (dateString) => {
	if (!dateString) return "Date not set";
	const options = { year: "numeric", month: "long" };
	return new Date(dateString).toLocaleDateString("en-US", options);
};

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
			console.error("Error deleting itinerary:", err);
			alert("Something went wrong while deleting the itinerary.");
		}
	};

	return (
		<div className="flex flex-col items-center bg-gray-50 min-h-[calc(100vh-5rem)] py-12 px-4 font-display">
			<div className="flex flex-col items-center mb-10">
				{user ? (
					<>
						<div
							className="relative w-28 h-28 rounded-full bg-cover bg-center"
							style={{ backgroundImage: `url(${user.profileImg || "./avatar.jpg"})` }}
						></div>
						<h1 className="text-3xl font-extrabold text-gray-900 mt-4 mb-1">{user.fullName}</h1>
						<p className="text-gray-500 text-sm mb-6">@{user.username}</p>
					</>
				) : (
					<div className="animate-pulse flex flex-col items-center">
						<div className="w-28 h-28 rounded-full bg-gray-300"></div>
						<div className="h-8 w-48 bg-gray-300 rounded mt-4 mb-1"></div>
						<div className="h-5 w-32 bg-gray-300 rounded mb-6"></div>
					</div>
				)}
				<button className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-200 transition duration-200">Edit Profile</button>
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

			{/* ======== TAB CONTENT ======== */}
			<div className="w-full max-w-xl">
				{/* --- About Tab --- */}
				{activeTab === "about" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
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

				{activeTab === "trips" && (
					<div className="space-y-6">
						{loading && <TripsSpinner />}
						{error && <p className="text-center text-red-500">{error}</p>}
						{!loading && !error && (
							<>
								{itineraries.length > 0 ? (
									<div className="grid grid-cols-1 gap-6">
										{itineraries.map((itinerary) => (
											<div
												key={itinerary._id}
												className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-200/80"
											>
												<div className="p-6">
													<p className="text-sm font-semibold text-[#ec6d13] mb-2">{formatDate(itinerary.createdAt)}</p>
													<h3 className="text-2xl font-bold text-gray-800 mb-2">{itinerary.city}</h3>
													<p className="text-gray-600 mb-4">{itinerary.days} Day Trip</p>
													<div className="flex items-center gap-3">
														<Link
															to="/itinerary"
															state={{ itineraryData: itinerary }}
															className="bg-[#ec6d13] text-white font-bold px-5 py-2 rounded-lg hover:bg-[#d45f0f] transition-colors"
														>
															View Itinerary
														</Link>

														<button
															onClick={() => handleDelete(itinerary._id)}
															className="bg-red-500 text-white font-bold px-5 py-2 rounded-lg hover:bg-red-600 transition-colors"
														>
															Delete
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200/80">
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
					</div>
				)}

				{activeTab === "saved" && (
					<div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 text-center">
						<h2 className="text-xl font-bold text-gray-900 mb-5">Saved Places</h2>
						<p className="text-gray-600">No saved places found. Discover new destinations!</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProfilePage;
