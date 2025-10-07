// src/components/LoadingSpinner.jsx

const LoadingSpinner = () => {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="relative">
				<div className="w-16 h-16 border-4 border-orange-200 rounded-full"></div>

				<div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#FF6B35] rounded-full animate-spin"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#FF6B35] rounded-full animate-pulse"></div>
			</div>

			<div className="mt-6 text-center">
				<p className="text-gray-700 text-lg font-medium mb-2">Searching for places...</p>
				<p className="text-gray-500 text-sm">This might take a few moments</p>
			</div>
		</div>
	);
};

export default LoadingSpinner;
