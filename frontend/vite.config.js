// https://vite.dev/config/
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	define: {
		"import.meta.env.VITE_API_URL": JSON.stringify(process.env.REACT_APP_API_URL || process.env.VITE_API_URL),
	},
});
