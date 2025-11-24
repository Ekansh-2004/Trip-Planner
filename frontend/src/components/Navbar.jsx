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
						{/* UPDATED LOGO SECTION */}
						<div className="h-12 w-12">
							<img 
								src="/LOGO.png" 
								alt="Trip Sage Logo" 
								// Added 'rounded-xl' here
								className="w-full h-full object-contain rounded-xl" 
							/>
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