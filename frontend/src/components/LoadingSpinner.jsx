const LoadingSpinner = () => {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="relative">
				{/* Outer ring */}
				<div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
				{/* Inner ring */}
				<div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
				{/* Center dot */}
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
			</div>

			<div className="mt-6 text-center">
				<p className="text-white text-lg font-medium mb-2">🔍 Searching for places...</p>
				<p className="text-white/80 text-sm">This might take a few moments</p>
			</div>

			{/* Animated background dots */}
			<div className="flex space-x-2 mt-4">
				<div
					className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
					style={{ animationDelay: "0ms" }}
				></div>
				<div
					className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
					style={{ animationDelay: "150ms" }}
				></div>
				<div
					className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
					style={{ animationDelay: "300ms" }}
				></div>
			</div>
		</div>
	);
};

export default LoadingSpinner;
