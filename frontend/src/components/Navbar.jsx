// components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
	const location = useLocation();

	return (
		<nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<div className="flex items-center">
						<h1 className="text-white text-2xl font-bold">🗺️ TripPlanner</h1>
					</div>

					{/* Navigation Links */}
					<div className="flex space-x-4">
						<Link
							to="/"
							className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === "/" ? "bg-white text-blue-600 font-semibold" : "text-white hover:bg-white/20"}`}
						>
							🏛️ Places
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
