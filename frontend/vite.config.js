import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host 0.0.0.0 is needed so the dev server is reachable from outside
// the container (otherwise it only listens inside the container).
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // when the code is mounted from my machine into the container, docker on mac does
    // not pass on the normal "file changed" events, so vite would not notice edits.
    // polling makes vite check the files itself, which is what turns hot reload back on.
    watch: {
      usePolling: true,
    },
  },
});
