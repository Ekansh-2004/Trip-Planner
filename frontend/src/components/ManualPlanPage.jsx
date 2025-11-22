// src/components/ManualPlanPage.jsx
import { useLocation, useNavigate } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomDateInput = forwardRef(({ value, onClick, label, placeholder, icon }, ref) => (
	<button
		type="button"
		className="w-full h-14 text-left bg-white rounded-xl border border-gray-300 px-5 shadow-sm transition hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ef5006]"
		onClick={onClick}
		ref={ref}
	>
		<div className="flex items-center gap-4">
			{icon}
			<div>
				<p className="text-xs font-semibold text-gray-500">{label}</p>
				<p className="text-base font-bold text-gray-800">{value || placeholder}</p>
			</div>
		</div>
	</button>
));

const ManualPlanPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const destinationFromNLP = location.state?.destination || "";
	const [step, setStep] = useState(1);
	const [destination, setDestination] = useState(destinationFromNLP);

	const [startingPoint, setStartingPoint] = useState("");
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);

	const progressPercentage = step === 1 ? 25 : step === 2 ? 66 : 100;

	const variants = {
		enter: { opacity: 0, y: 20 },
		center: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
	};

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => {
		if (step === 2) setStartingPoint("");
		if (step === 3) {
			setStartDate(null);
			setEndDate(null);
		}
		setStep((prev) => prev - 1);
	};

	const iconProps = {
		className: "w-6 h-6 text-gray-400",
		strokeWidth: 2,
		fill: "none",
		stroke: "currentColor",
	};

	const handleCreateItinerary = () => {
		navigate("/itinerary", {
			state: {
				city: destination.trim(),
				startLocation: startingPoint.trim(),
				startDate: startDate?.toISOString(),
				endDate: endDate?.toISOString(),
			},
		});
	};

	return (
		<div className="flex flex-col flex-grow items-center justify-center p-4 min-h-[calc(100vh-5rem)]">
			<div className="w-full max-w-xl bg-[#fdfdfd] rounded-2xl shadow-xl overflow-hidden border border-gray-200/80">
				<div className="p-6 border-b border-gray-200/80">
					<h3 className="text-sm font-semibold text-gray-500 mb-2">Step {step} of 3</h3>
					<div className="bg-gray-200 rounded-full h-2">
						<motion.div
							className="bg-gradient-to-r from-[#fa7938] to-[#ef5006] h-2 rounded-full"
							initial={{ width: "25%" }}
							animate={{ width: `${progressPercentage}%` }}
							transition={{ duration: 0.5, ease: "easeInOut" }}
						/>
					</div>
				</div>

				<div className="relative h-80">
					<AnimatePresence mode="wait">
						{step === 1 && (
							<motion.div
								key="step1"
								className="absolute w-full h-full p-6 flex flex-col justify-center"
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.3, ease: "easeInOut" }}
							>
								<h2 className="text-3xl font-extrabold text-[#181311] mb-2">Where do you want to go?</h2>
								<p className="text-gray-500 mb-6">Start by telling us your dream destination.</p>
								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
										<svg
											{...iconProps}
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
											/>
										</svg>
									</div>
									<input
										className="w-full h-14 rounded-xl border-gray-300 bg-gray-50/80 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ef5006] focus:border-transparent pl-16 pr-6 text-lg transition"
										value={destination}
										onChange={(e) => setDestination(e.target.value)}
										placeholder="e.g., Jaipur, India"
										type="text"

										onKeyPress={(e) => {
											if (e.key === "Enter" && destination) {
												handleNext();
											}
										}}
									/>
								</div>
								<button
									onClick={handleNext}
									disabled={!destination}
									className="mt-6 ml-auto px-8 py-3 rounded-lg bg-[#ef5006] text-white font-bold shadow-lg shadow-[#ef5006]/30 disabled:bg-gray-300 disabled:shadow-none transition-all transform hover:scale-105"
								>
									Next
								</button>
							</motion.div>
						)}

						{step === 2 && (
							<motion.div
								key="step2"
								className="absolute w-full h-full p-6 flex flex-col justify-center"
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.3, ease: "easeInOut" }}
							>
								<h2 className="text-3xl font-extrabold text-[#181311] mb-2">{`Where in ${destination || "your destination"} will your trip begin?`}</h2>
								<p className="text-gray-500 mb-6">Enter your starting point, such as a hotel or station.</p>
								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
										<svg
											{...iconProps}
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
											/>
										</svg>
									</div>

									<input
										className="w-full h-14 rounded-xl border-gray-300 bg-gray-50/80 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ef5006] focus:border-transparent pl-16 pr-6 text-lg transition"
										value={startingPoint}
										onChange={(e) => setStartingPoint(e.target.value)}
										placeholder="e.g., Jaipur Junction"
										type="text"

										onKeyPress={(e) => {
											if (e.key === "Enter" && startingPoint) {
												handleNext();
											}
										}}
									/>
								</div>
								<div className="mt-6 flex justify-between items-center">
									<button
										onClick={handleBack}
										className="px-8 py-3 rounded-lg bg-gray-200 text-gray-700 font-bold transition transform hover:scale-105"
									>
										Back
									</button>
									<button
										onClick={handleNext}
										disabled={!startingPoint}
										className="px-8 py-3 rounded-lg bg-[#ef5006] text-white font-bold shadow-lg shadow-[#ef5006]/30 disabled:bg-gray-300 disabled:shadow-none transition-all transform hover:scale-105"
									>
										Next
									</button>
								</div>
							</motion.div>
						)}

						{step === 3 && (
							<motion.div
								key="step3"
								className="absolute w-full h-full p-6 flex flex-col justify-center"
								variants={variants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.3, ease: "easeInOut" }}
							>
								<h2 className="text-3xl font-extrabold text-[#181311] mb-2">When are you traveling?</h2>
								<p className="text-gray-500 mb-6">Select your start and end dates for the trip.</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<DatePicker
										selected={startDate}
										onChange={(date) => setStartDate(date)}
										selectsStart
										startDate={startDate}
										endDate={endDate}
										dateFormat="dd MMMM yy"
										customInput={
											<CustomDateInput
												label="Start Date"
												placeholder="Select start date"
												icon={
													<svg
														{...iconProps}
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18"
														/>
													</svg>
												}
											/>
										}
										portalId="datepicker-portal"
										minDate={new Date()}
									/>
									<DatePicker
										selected={endDate}
										onChange={(date) => setEndDate(date)}
										selectsEnd
										startDate={startDate}
										endDate={endDate}
										minDate={startDate}
										dateFormat="dd MMMM yy"
										customInput={
											<CustomDateInput
												label="End Date"
												placeholder="Select end date"
												icon={
													<svg
														{...iconProps}
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M9 14.25l2.25 2.25 4.5-4.5"
														/>
													</svg>
												}
											/>
										}
										portalId="datepicker-portal"
									/>
								</div>
								<div className="mt-6 flex justify-between items-center">
									<button
										onClick={handleBack}
										className="px-8 py-3 rounded-lg bg-gray-200 text-gray-700 font-bold transition transform hover:scale-105"
									>
										Back
									</button>
									<button
										onClick={handleCreateItinerary}
										disabled={!startDate || !endDate}
										className="px-8 py-3 rounded-lg bg-[#ef5006] text-white font-bold shadow-lg shadow-[#ef5006]/30 disabled:bg-gray-300 disabled:shadow-none transition-all transform hover:scale-105"
									>
										Create My Itinerary
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
};

export default ManualPlanPage;
