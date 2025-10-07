// src/components/EmptyState.jsx

const EmptyState = () => (
	<div className="text-center py-16 px-6 bg-white rounded-2xl shadow-lg border border-[#DEE2E6] col-span-1 sm:col-span-2 lg:col-span-3">
		<div className="mx-auto w-24 h-24 text-[#FF6B35]">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={1}
				stroke="currentColor"
				className="w-full h-full"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
				/>
			</svg>
		</div>
		<h3 className="mt-4 text-2xl font-bold text-[#212529]">Start Your Discovery</h3>
		<p className="mt-2 text-lg text-[#6C757D]">Enter a location above to find top-rated places near you.</p>
	</div>
);

export default EmptyState;
