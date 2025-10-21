import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// Import Components
import HomePage from "./components/HomePage";
import ItineraryPage from "./components/ItineraryPage";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import LocationSearch from "./components/LocationSearch";
import LoginPage from "./components/LoginPage";
import ManualPlanPage from "./components/ManualPlanPage";
import Navbar from "./components/Navbar";
import PlaceDetailsPage from "./components/PlaceDetailsPage";
import ProfilePage from "./components/ProfilePage";

// Reusable Layout Component - Updated to accept authUser
const AppLayout = ({ authUser, onLogout }) => {
	const location = useLocation();

	const getPageStyle = () => {
		const path = location.pathname;
		if (path.startsWith("/profile")) return { backgroundImage: `url('/ProfileBG.png')`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" };
		if (path === "/") return { backgroundImage: `url('/HomeBG3.jpg')`, backgroundSize: "cover", backgroundPosition: "center 10%" };
		if (path.startsWith("/discover") || path.startsWith("/itinerary") || path.startsWith("/manual-plan")) return { backgroundImage: `url('/DiscoverBG.png')`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" };
		return { backgroundColor: "#f9fafb" };
	};

	return (
		<div
			className="min-h-screen"
			style={getPageStyle()}
		>
			{/* Navbar now receives the authUser prop */}
			<Navbar
				authUser={authUser}
				onLogout={onLogout}
			/>
			<main>
				<Outlet />
			</main>
		</div>
	);
};

// Main App Component
function App() {
	const [authUser, setAuthUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Check if the user is already logged in on initial load
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const res = await fetch("http://localhost:3000/api/auth/me", { credentials: "include" });

				const data = await res.json();
				if (data.error) {
					setAuthUser(null);
				} else {
					setAuthUser(data);
				}
			} catch (error) {
				setAuthUser(null);
			} finally {
				setIsLoading(false);
			}
		};
		checkAuthStatus();
	}, []);

	const handleLogin = (user) => {
		setAuthUser(user);
	};

	const handleLogout = async () => {
		try {
			await fetch("http://localhost:3000/api/auth/logout", { method: "POST" });
			setAuthUser(null);
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	// Shared search context for Discover Page (remains the same)
	const [location, setLocation] = useState("");
	const [coordinates, setCoordinates] = useState(null);
	const [radius, setRadius] = useState(2000);
	const [hotels, setHotels] = useState([]);
	const [restaurants, setRestaurants] = useState([]);
	const [attractions, setAttractions] = useState([]);

	const searchProps = {
		location,
		setLocation,
		coordinates,
		setCoordinates,
		radius,
		setRadius,
		hotels,
		setHotels,
		restaurants,
		setRestaurants,
		attractions,
		setAttractions,
	};

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<Router>
			<Routes>
				{!authUser ? (
					<>
						<Route
							path="/login"
							element={<LoginPage onLogin={handleLogin} />}
						/>
						{/* Redirect everything except /login to /login */}
						<Route
							path="*"
							element={
								<Navigate
									to="/login"
									replace
								/>
							}
						/>
					</>
				) : (
					<Route
						element={
							<AppLayout
								authUser={authUser}
								onLogout={handleLogout}
							/>
						}
					>
						<Route
							path="/"
							element={<HomePage />}
						/>
						<Route
							path="/discover"
							element={<LocationSearch {...searchProps} />}
						/>
						<Route
							path="/manual-plan"
							element={<ManualPlanPage />}
						/>
						<Route
							path="/place/:id"
							element={<PlaceDetailsPage />}
						/>
						<Route
							path="/itinerary"
							element={<ItineraryPage />}
						/>
						<Route
							path="/profile"
							element={<ProfilePage />}
						/>
						<Route
							path="*"
							element={
								<Navigate
									to="/"
									replace
								/>
							}
						/>
					</Route>
				)}
			</Routes>
		</Router>
	);
}

export default App;
