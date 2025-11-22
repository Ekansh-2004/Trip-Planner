// src/components/ActionCard.jsx

export const ActionCard = ({ title, subtitle, buttonText, onClick }) => {
	return (
		<div className="relative mb-6">
			<div className="absolute left-[-15px] top-6 w-5 h-5 bg-gray-300 rounded-full border-4 border-white"></div>
			<div className="bg-orange-50/50 rounded-2xl p-6 border-2 border-dashed border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div>
					<h4 className="font-bold text-orange-800">{title}</h4>
					<p className="text-sm text-orange-600">{subtitle}</p>
				</div>
				<button
					onClick={onClick} 
					className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
				>
					{buttonText}
				</button>
			</div>
		</div>
	);
};
