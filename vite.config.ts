/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind every local address so http://127.0.0.1 and http://localhost hit the same server.
    host: true,
    proxy: {
      "/ws": {
        target: "http://127.0.0.1:8787",
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
});
