// src/components/NLPPlanPage.jsx
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NLPPlanPage = () => {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState(null);
	const [error, setError] = useState(null);
	const [manualDuration, setManualDuration] = useState("");
	const navigate = useNavigate();

	const handleAnalyze = async () => {
		if (!query.trim()) return;
		setLoading(true);
		setError(null);
		setResults(null);
		setManualDuration("");

		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/nlp/analyze`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: query }),
			});
			const data = await response.json();
			if (response.ok) {
				setResults(data);
			} else {
				setError(data.error || "Something went wrong");
			}
		} catch (err) {
			setError("Failed to connect to the server.");
		} finally {
			setLoading(false);
		}
	};

	const variants = {
		enter: { opacity: 0, y: 20 },
		center: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
	};

	return (
		<div className="flex flex-col flex-grow items-center justify-center p-4 min-h-[calc(100vh-5rem)]">
			<div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-3xl font-extrabold text-[#181311] mb-2">Describe your trip idea </h2>
					<p className="text-gray-500">Tell us what kind of destination you want to explore.</p>
				</div>

				<div className="p-6 flex flex-col gap-4">
					<textarea
						className="w-full h-32 rounded-xl border border-gray-300 bg-gray-50/80 p-4 text-lg placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ef5006]"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder='e.g., "I want to visit a hill station in India" or "Show me some beach destinations"'
					/>

					<button
						onClick={handleAnalyze}
						disabled={loading || !query.trim()}
						className="self-end px-8 py-3 rounded-lg bg-[#ef5006] text-white font-bold shadow-lg shadow-[#ef5006]/30 disabled:bg-gray-300 transition-all transform hover:scale-105"
					>
						{loading ? "Analyzing..." : "Find Destinations"}
					</button>
				</div>

				<div className="p-6 border-t border-gray-200 bg-gray-50">
					<AnimatePresence mode="wait">
						{error && (
							<motion.p
								key="error"
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								className="text-center text-red-600 font-semibold"
							>
								{error}
							</motion.p>
						)}

						{results && (
							<motion.div
								key="results"
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								className="text-center"
							>
								<h3 className="text-xl font-bold text-gray-800 mb-3">{results.message}</h3>

								{results.suggestions?.length > 0 ? (
									<>
										{!results.extracted?.duration_days && (
											<div className="mb-4 flex items-center justify-center gap-2">
												<label
													htmlFor="manual-duration"
													className="text-sm text-gray-600"
												>
													How many days is your trip? (optional)
												</label>
												<input
													id="manual-duration"
													type="number"
													min="1"
													max="30"
													value={manualDuration}
													onChange={(e) => setManualDuration(e.target.value)}
													placeholder="e.g. 4"
													className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#ef5006]"
												/>
											</div>
										)}
										<div className="flex flex-wrap justify-center gap-3">
											{results.suggestions.map((place, idx) => (
												<button
													key={idx}
													onClick={() =>
														navigate("/manual-plan", {
															state: {
																destination: place,
																durationDays:
																	results.extracted?.duration_days || (manualDuration ? Number(manualDuration) : null),
															},
														})
													}
													className="bg-white border border-gray-200 px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition hover:bg-[#ef5006]/10"
												>
													<span className="text-[#ef5006] font-semibold">{place}</span>
												</button>
											))}
										</div>
									</>
								) : (
									<p className="text-gray-500 italic">No suggestions found for your input.</p>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
};

export default NLPPlanPage;
