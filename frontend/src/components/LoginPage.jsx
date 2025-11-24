// src/components/LoginPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const LoginPage = ({ onLogin }) => {
	const [activeTab, setActiveTab] = useState("login");
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState({
		fullName: "",
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const handleInputChange = (e) => {
		setError(null);
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleLoginSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("http://localhost:3001/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					username: formData.username,
					password: formData.password,
				}),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			if (onLogin) onLogin(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSignupSubmit = async (e) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match!");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("http://localhost:3001/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					fullName: formData.fullName,
					username: formData.username,
					email: formData.email,
					password: formData.password,
				}),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			if (onLogin) onLogin(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const getTabButtonClass = (tabName) => {
		const baseClasses = "w-1/2 py-3 text-sm font-bold rounded-lg transition-all duration-200";
		if (activeTab === tabName) {
			return `${baseClasses} bg-[#fa7938] text-white shadow-md`;
		}
		return `${baseClasses} text-gray-600 hover:bg-gray-100`;
	};

	return (
		<div
			className="flex flex-col min-h-screen font-display"
			style={{
				backgroundImage: `url('/LoginBG2.png')`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundAttachment: "fixed",
			}}
		>
			{/* Header - Centered and Simplified */}
			<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
				<nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-24">
					<div className="flex items-center gap-4 transition-transform duration-300 hover:scale-105 cursor-default">
						{/* Logo */}
						<div className="h-14 w-14 bg-white/50 rounded-2xl shadow-sm p-1">
							<img
								src="/LOGO.png"
								alt="Trip Sage Logo"
								className="w-full h-full object-contain rounded-xl"
							/>
						</div>
						{/* Brand Name */}
						<h1 className="text-3xl font-extrabold tracking-tight text-[#FF6B35] drop-shadow-sm">Trip Sage</h1>
					</div>
				</nav>
			</header>

			<main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					{/* Hero Text */}
					<div className="text-center mb-8">
						<h2 className="text-4xl font-extrabold tracking-tight text-[#181311] mb-4">
							Welcome to Trip Sage
						</h2>
						<p className="text-xl font-medium text-[#4A3B32] max-w-sm mx-auto leading-relaxed">
							Discover the world with itineraries crafted just for you.
						</p>
					</div>

					{/* Card Container */}
					<div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
						{/* Tabs */}
						<div className="bg-gray-100 p-1.5 rounded-xl flex items-center mb-8">
							<button
								className={getTabButtonClass("login")}
								onClick={() => setActiveTab("login")}
							>
								Log in
							</button>
							<button
								className={getTabButtonClass("signup")}
								onClick={() => setActiveTab("signup")}
							>
								Sign up
							</button>
						</div>

						{/* Login Form */}
						{activeTab === "login" && (
							<form
								onSubmit={handleLoginSubmit}
								className="space-y-5"
							>
								<div className="space-y-4">
									<div>
										<label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Username</label>
										<input
											name="username"
											value={formData.username}
											onChange={handleInputChange}
											type="text"
											required
											className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] focus:border-transparent transition-all placeholder-gray-400 text-gray-900 font-medium"
											placeholder="Enter your username"
										/>
									</div>
									<div>
										<label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
										<input
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											type="password"
											required
											className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] focus:border-transparent transition-all placeholder-gray-400 text-gray-900 font-medium"
											placeholder="Enter your password"
										/>
									</div>
								</div>
								<div className="flex justify-end">
									<a
										href="#"
										className="text-sm font-semibold text-[#fa7938] hover:text-[#e66020] transition-colors"
									>
										Forgot password?
									</a>
								</div>
								<button
									type="submit"
									disabled={loading}
									className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-[#fa7938]/30 text-sm font-bold text-white bg-[#fa7938] hover:bg-[#e66020] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fa7938] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
								>
									{loading ? "Logging in..." : "Log in"}
								</button>
							</form>
						)}

						{/* Signup Form */}
						{activeTab === "signup" && (
							<form
								onSubmit={handleSignupSubmit}
								className="space-y-5"
							>
								<div className="space-y-3">
									<div className="grid grid-cols-2 gap-3">
										<div>
											<input
												name="fullName"
												value={formData.fullName}
												onChange={handleInputChange}
												type="text"
												placeholder="Full Name"
												required
												className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] transition-all font-medium"
											/>
										</div>
										<div>
											<input
												name="username"
												value={formData.username}
												onChange={handleInputChange}
												type="text"
												placeholder="Username"
												required
												className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] transition-all font-medium"
											/>
										</div>
									</div>
									<div>
										<input
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											type="email"
											placeholder="Email address"
											required
											className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] transition-all font-medium"
										/>
									</div>
									<div>
										<input
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											type="password"
											placeholder="Password"
											required
											className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] transition-all font-medium"
										/>
									</div>
									<div>
										<input
											name="confirmPassword"
											value={formData.confirmPassword}
											onChange={handleInputChange}
											type="password"
											placeholder="Confirm Password"
											required
											className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa7938] transition-all font-medium"
										/>
									</div>
								</div>

								<p className="text-xs text-center text-gray-500 mt-2">
									By joining, you agree to our{" "}
									<a
										href="#"
										className="font-bold text-gray-700 hover:underline"
									>
										Terms
									</a>{" "}
									and{" "}
									<a
										href="#"
										className="font-bold text-gray-700 hover:underline"
									>
										Privacy Policy
									</a>
									.
								</p>

								<button
									type="submit"
									disabled={loading}
									className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-[#fa7938]/30 text-sm font-bold text-white bg-[#fa7938] hover:bg-[#e66020] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fa7938] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
								>
									{loading ? "Creating Account..." : "Create account"}
								</button>
							</form>
						)}

						{error && (
							<div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center gap-2 text-red-600 text-sm font-medium animate-pulse">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="w-4 h-4"
								>
									<path
										fillRule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clipRule="evenodd"
									/>
								</svg>
								{error}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default LoginPage;