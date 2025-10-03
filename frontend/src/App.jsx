import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LocationSearch from "./components/LocationSearch";
import Navbar from "./components/Navbar";
import PlaceDetailsPage from "./components/PlaceDetailsPage"; // ✅ Import new page

function App() {
	return (
		<Router>
			<div className="min-h-screen">
				<Navbar />

				<Routes>
					<Route
						path="/"
						element={<LocationSearch />}
					/>
					<Route
						path="/place/:placeId"
						element={<PlaceDetailsPage />}
					/>{" "}
					{/* ✅ New route */}
				</Routes>
			</div>
		</Router>
	);
}

export default App;
