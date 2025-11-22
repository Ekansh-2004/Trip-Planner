import { useState } from "react";

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
		const baseClasses = "w-1/2 py-2.5 text-sm font-bold rounded-md transition-colors";
		if (activeTab === tabName) {
			return `${baseClasses} bg-[#fa7938] text-white`;
		}
		return `${baseClasses} text-gray-700 hover:bg-[#fa7938]/10`;
	};

	return (
		<div
			className="flex flex-col min-h-screen"
			style={{
				backgroundImage: `url('/LoginBG2.png')`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundAttachment: "fixed",
			}}
		>
			<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#DEE2E6]">
				<nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
					<div className="flex items-center gap-3">
						<div className="size-10 text-[#FF6B35]"></div>
						<h1 className="text-2xl font-bold leading-tight text-[#FF6B35]">Trip Sage</h1>
					</div>
					<button className="px-4 py-2 rounded-lg text-sm font-bold bg-[#fa7938]/10 text-[#fa7938] hover:bg-[#fa7938]/20 transition-colors">Help</button>
				</nav>
			</header>

			<main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold tracking-tight text-[#181311]">Welcome to Trip Sage</h2>
						<p className="mt-2 text-[#8c6e5f]">Your AI-powered travel planner.</p>
					</div>

					<div className="bg-white/90 backdrop-blur-md p-8 rounded-xl border border-gray-200 shadow-xl">
						<div className="bg-[#f0edea] p-1 rounded-lg flex items-center mb-8">
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

						{activeTab === "login" && (
							<form
								onSubmit={handleLoginSubmit}
								className="space-y-6"
							>
								<div className="space-y-4">
									<div>
										<input
											name="username"
											value={formData.username}
											onChange={handleInputChange}
											type="text"
											required
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
											placeholder="Username"
										/>
									</div>
									<div>
										<input
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											type="password"
											required
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
											placeholder="Password"
										/>
									</div>
								</div>
								<div className="text-right text-sm">
									<a
										href="#"
										className="font-medium text-[#fa7938] hover:text-[#fa7938]/80"
									>
										Forgot your password?
									</a>
								</div>
								<div>
									<button
										type="submit"
										disabled={loading}
										className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-[#fa7938] hover:bg-[#fa7938]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fa7938] disabled:bg-gray-400 disabled:cursor-not-allowed"
									>
										{loading ? "Logging in..." : "Log in"}
									</button>
								</div>
							</form>
						)}

						{activeTab === "signup" && (
							<form
								onSubmit={handleSignupSubmit}
								className="space-y-6"
							>
								<div className="space-y-4">
									<div>
										<input
											name="fullName"
											value={formData.fullName}
											onChange={handleInputChange}
											type="text"
											placeholder="Full Name"
											required
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
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
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
										/>
									</div>
									<div>
										<input
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											type="email"
											placeholder="Email address"
											required
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
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
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
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
											className="w-full px-4 py-3 rounded-lg bg-[#f0edea] border-transparent focus:outline-none focus:ring-2 focus:ring-[#fa7938]"
										/>
									</div>
								</div>
								<div className="text-left text-xs text-[#8c6e5f]">
									By signing up, you agree to our{" "}
									<a
										href="#"
										className="font-medium text-[#fa7938] hover:text-[#fa7938]/80"
									>
										Terms of Service
									</a>
									.
								</div>
								<div>
									<button
										type="submit"
										disabled={loading}
										className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-[#fa7938] hover:bg-[#fa7938]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fa7938] disabled:bg-gray-400 disabled:cursor-not-allowed"
									>
										{loading ? "Creating Account..." : "Create account"}
									</button>
								</div>
							</form>
						)}

						{error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

						<div className="relative mt-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-[#8c6e5f]">Or continue with</span>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-2 gap-3"></div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default LoginPage;
