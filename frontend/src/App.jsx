import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

import HomePage from "./components/HomePage";
import ItineraryPage from "./components/ItineraryPage";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import LocationSearch from "./components/LocationSearch";
import LoginPage from "./components/LoginPage";
import ManualPlanPage from "./components/ManualPlanPage";
import Navbar from "./components/Navbar";
import NLPPlanPage from "./components/NLPPlanPage";
import PlaceDetailsPage from "./components/PlaceDetailsPage";
import ProfilePage from "./components/ProfilePage";

const AppLayout = ({ authUser, onLogout }) => {
	const location = useLocation();

	const getPageStyle = () => {
		const path = location.pathname;
		if (path.startsWith("/profile")) return { backgroundImage: `url('/ProfileBG.png')`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" };
		if (path === "/") return { backgroundImage: `url('/HomeBG3.jpg')`, backgroundSize: "cover", backgroundPosition: "center 10%" };
		if (path.startsWith("/discover") || path.startsWith("/itinerary") || path.startsWith("/nlp-plan") || path.startsWith("/manual-plan") || path.startsWith("/place")) return { backgroundImage: `url('/DiscoverBG.png')`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" };
		return { backgroundColor: "#f9fafb" };
	};

	return (
		<div
			className="min-h-screen"
			style={getPageStyle()}
		>
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

function App() {
	const [authUser, setAuthUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
					credentials: "include",
				});

				if (!res.ok) {
					setAuthUser(null);
				} else {
					const data = await res.json();
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
			await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
			setAuthUser(null);
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

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
							path="/nlp-plan"
							element={<NLPPlanPage />}
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
