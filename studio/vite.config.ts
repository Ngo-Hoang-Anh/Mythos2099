import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const studioRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: studioRoot,
  publicDir: fileURLToPath(new URL("../public", import.meta.url)),
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    fs: { allow: [repoRoot, studioRoot] },
  },
});
