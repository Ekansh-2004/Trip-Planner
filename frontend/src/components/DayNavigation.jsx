// src/components/DayNavigation.jsx
import { motion } from "framer-motion"; 

export const DayNavigation = ({ days, activeDay, onDaySelect }) => {
	return (

		<div className="print:hidden sticky top-[80px] z-10 bg-white/90 backdrop-blur-sm pt-4 pb-2 -mx-4 px-4">

			<div className="relative flex border-b border-gray-200">
				{days.map((day) => (
					<button
						key={day}
						onClick={() => onDaySelect(day)}

						className={`w-1/3 relative py-3 text-center font-bold text-base transition-colors ${
							activeDay === day ? "text-[#ef5006]" : "text-gray-500 hover:text-gray-800"
						}`}
					>

						{activeDay === day && (
							<motion.div
								className="absolute bottom-[-1px] left-0 right-0 h-1 bg-[#ef5006] rounded-full" 
								layoutId="day-underline" 
								transition={{ type: "spring", stiffness: 380, damping: 30 }}
							/>
						)}
						<span className="relative z-10">{day}</span>
					</button>
				))}
			</div>
		</div>
	);
};