// src/components/TravelConnector.jsx

export const TravelConnector = ({ time, distance, traffic, icon }) => {
	const trafficStyles = {
		Heavy: "text-red-500",
		Moderate: "text-orange-500",
		Light: "text-green-500",
	};
	const trafficDotStyles = {
		Heavy: "bg-red-500",
		Moderate: "bg-orange-500",
		Light: "bg-green-500",
	};

	const getTransportIcon = () => {
		const iconProps = {
			className: "w-5 h-5 text-gray-500",
			strokeWidth: "2",
			fill: "none",
			viewBox: "0 0 24 24",
			stroke: "currentColor",
		};
		switch (icon) {
			case "hotel":
			case "restaurant":
				return null;
			default:
				return (
					<svg {...iconProps}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13 17H6v-2l5-5h4l5 5v2h-3"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 17v-1a2 2 0 012-2h4a2 2 0 012 2v1"
						/>
					</svg>
				);
		}
	};

	return (
		<div className="relative h-16 pl-14 flex items-center">
			<div className="absolute left-[29px] top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 rounded-full border-4 border-white"></div>

			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-3">
					{getTransportIcon()}
					<p className="text-sm font-semibold text-gray-500">
						{time} {distance && `· ${distance}`}
					</p>
				</div>

				{traffic && (
					<div className="flex items-center gap-2">
						<span className={`w-2.5 h-2.5 rounded-full ${trafficDotStyles[traffic]}`}></span>
						<span className={`text-sm font-semibold ${trafficStyles[traffic]}`}>{traffic} Traffic</span>
					</div>
				)}
			</div>
		</div>
	);
};
