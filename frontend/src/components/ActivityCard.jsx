// src/components/ActivityCard.jsx

export const ActivityCard = ({ title, rating, reviews, fee, opening_time, closing_time, imageUrl }) => {
	return (
		<div className="relative mb-6 pl-14">
			<div className="absolute left-[24px] top-6 w-5 h-5 bg-orange-500 rounded-full border-4 border-white"></div>
			<div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl">
				<div className="flex flex-col md:flex-row">
					<img
						src={imageUrl}
						alt={title}
						className="w-full md:w-56 h-48 object-cover"
					/>
					<div className="p-6 flex flex-col justify-center">
						<h4 className="text-xl font-bold text-gray-800">{title}</h4>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
							{rating && (
								<div className="flex items-center gap-1">
									<svg
										className="w-4 h-4 text-yellow-500"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									<span>{rating}</span>
								</div>
							)}
							{reviews && <span>{reviews} reviews</span>}
							{fee && <span>Entry Fee: {fee}</span>}
						</div>

						{opening_time && closing_time && (
							<p className="text-sm text-gray-500 mt-2">
								Timings: {opening_time} – {closing_time}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
