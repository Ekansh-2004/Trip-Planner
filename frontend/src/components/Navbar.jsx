// src/components/Navbar.jsx

import { Link, NavLink } from "react-router-dom";

const Navbar = ({ authUser, onLogout }) => {
	const getLinkClass = ({ isActive }) => {
		const baseClasses = "text-base font-medium transition-colors";
		return isActive ? `${baseClasses} text-[#FF6B35] font-bold` : `${baseClasses} text-[#6C757D] hover:text-[#212529]`;
	};

	return (
		<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#DEE2E6]">
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-20">
					<Link
						to="/"
						className="flex items-center gap-3"
					>
						<div className="size-10 text-[#FF6B35]">
							<svg
								fill="none"
								viewBox="0 0 48 48"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819Z"
									fill="#FF6B35"
								/>
								<path
									d="M9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487Z"
									fill="#0A74DA"
									opacity="0.7"
								/>
								<path
									d="M27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263Z"
									fill="#0A74DA"
									opacity="0.7"
								/>
								<path
									d="M25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.9854 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
									fill="#FF6B35"
									opacity="0.3"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold leading-tight text-[#FF6B35]">Trip Sage</h2>
					</Link>

					<nav className="hidden md:flex items-center gap-8">
						<NavLink
							to="/"
							className={getLinkClass}
							end
						>
							Home
						</NavLink>
						<NavLink
							to="/discover"
							className={getLinkClass}
						>
							Discover
						</NavLink>

						<NavLink
							to="/profile"
							state={{ defaultTab: "trips" }}
							className={getLinkClass}
						>
							My Trips
						</NavLink>
					</nav>

					<div className="flex items-center gap-4">
						<button className="md:hidden flex items-center justify-center rounded-full h-10 w-10 text-[#FF6B35]">
							<span className="material-symbols-outlined">menu</span>
						</button>

						{authUser ? (
							<>
								<Link to="/profile">
									<div
										className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-[#FF6B35]"
										style={{
											backgroundImage: `url("${authUser.profileImg || "./avatar.jpg"}")`,
										}}
									></div>
								</Link>
								<button
									onClick={onLogout}
									className="px-4 py-2 rounded-lg text-sm font-bold bg-[#fa7938]/10 text-[#fa7938] hover:bg-[#fa7938]/20 transition-colors"
								>
									Logout
								</button>
							</>
						) : (
							<Link to="/login">
								<button className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#fa7938] text-white hover:bg-[#fa7938]/90 transition-colors">Login</button>
							</Link>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
