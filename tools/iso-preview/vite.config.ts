import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const previewRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root: previewRoot,
  publicDir: false,
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    fs: { allow: [repoRoot, previewRoot] },
  },
});
