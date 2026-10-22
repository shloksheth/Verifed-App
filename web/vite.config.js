import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React plugin handles JSX and refreshes changed components during development.
export default defineConfig({
  plugins: [react()],
});
