// src/components/DayNavigation.jsx

export const DayNavigation = ({ days, activeDay, onDaySelect }) => {
	return (
		<div className="sticky top-[80px] z-10 bg-white/90 backdrop-blur-sm -mx-4 px-4">
			<div className="flex border-b border-gray-200">
				{days.map((day) => (
					<button
						key={day}
						onClick={() => onDaySelect(day)}
						className={`px-6 py-3 text-center font-bold text-lg transition-all ${activeDay === day ? "border-b-2 border-green-500 text-gray-800" : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"}`}
					>
						{day}
					</button>
				))}
			</div>
		</div>
	);
};