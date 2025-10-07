// src/components/HomePage.jsx

import { Link } from "react-router-dom";

const HomePage = () => {
	return (
		<div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-20 min-h-[calc(100vh-5rem)] font-display">
			<div className="max-w-4xl">
				<h1
					className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter"
					style={{ textShadow: "0 4px 15px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.4)" }}
				>
					Craft Your Journey with Trip Sage
				</h1>
				<p
					className="mt-6 text-xl md:text-2xl font-semibold text-white/95 max-w-2xl mx-auto"
					style={{ textShadow: "0 3px 12px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)" }}
				>
					Plan your perfect trip with our intuitive travel planning tools. Let's start your adventure.
				</p>
			</div>

			<div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
				<Link
					to="#"
					className="group block p-8 rounded-xl bg-black/15 backdrop-blur-md border border-white/30 shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:bg-black/25 hover:shadow-2xl hover:shadow-primary/30 hover:border-primary/50"
				>
					<h3 className="text-2xl font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.4)]">Enter Complete Details</h3>
					<p className="mt-2 text-base text-white/90 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.4)]">Already have a plan? Input your destinations, dates, and activities to build a detailed itinerary.</p>
				</Link>

				<Link
					to="#"
					className="group block p-8 rounded-xl bg-black/15 backdrop-blur-md border border-white/30 shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:bg-black/25 hover:shadow-2xl hover:shadow-primary/30 hover:border-primary/50"
				>
					<h3 className="text-2xl font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.4)]">Describe Destination</h3>
					<p className="mt-2 text-base text-white/90 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.4)]">Dreaming of an experience? Describe your ideal trip, and we'll suggest personalized destinations.</p>
				</Link>
			</div>
		</div>
	);
};

export default HomePage;
