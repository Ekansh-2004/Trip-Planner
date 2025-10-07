// src/App.jsx

import { useState } from "react";
import { Outlet, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// Import Components
import HomePage from "./components/HomePage";
import ItineraryPage from "./components/ItineraryPage";
import LocationSearch from "./components/LocationSearch";
import Navbar from "./components/Navbar";
import PlaceDetailsPage from "./components/PlaceDetailsPage";

const Layout = () => {
	const location = useLocation();

	const isHomePage = location.pathname === "/";
	const isDiscoverPage = location.pathname.startsWith("/discover");
	const isItineraryPage = location.pathname.startsWith("/itinerary");

	// Dynamically set background style
	const style = {};
	if (isHomePage) {
		style.backgroundImage = "url('/HomeBG3.jpg')";
		style.backgroundSize = "cover";
		style.backgroundPosition = "center 10%";
	} else if (isDiscoverPage || isItineraryPage) {
		style.backgroundImage = "url('/DiscoverBG.png')";
		style.backgroundSize = "cover";
		style.backgroundPosition = "center";
		style.backgroundAttachment = "fixed";
	}

	const hasImageBg = isHomePage || isDiscoverPage || isItineraryPage;
	const wrapperClass = `relative min-h-screen ${!hasImageBg ? "bg-gray-50" : ""}`;

	return (
		<div
			className={wrapperClass}
			style={style}
		>
			<Navbar variant="default" />
			<main>
				<Outlet />
			</main>
		</div>
	);
};

function App() {
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

	return (
		<Router>
			<Routes>
				<Route element={<Layout />}>
					<Route
						path="/"
						element={<HomePage />}
					/>
					<Route
						path="/discover"
						element={<LocationSearch {...searchProps} />}
					/>
					<Route
						path="/place/:id"
						element={<PlaceDetailsPage />}
					/>
					<Route
						path="/itinerary"
						element={<ItineraryPage />}
					/>
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
