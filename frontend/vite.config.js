import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host 0.0.0.0 is needed so the dev server is reachable from outside
// the container (otherwise it only listens inside the container).
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
