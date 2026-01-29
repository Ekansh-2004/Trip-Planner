import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		"import.meta.env.VITE_API_URL": JSON.stringify(process.env.REACT_APP_API_URL || process.env.VITE_API_URL),
	},
});
