import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist-web", sourcemap: false },
  server: {
    port: Number(process.env.UI_PORT || 3000),
    strictPort: true,
    proxy: { "/api": process.env.VITE_API_TARGET || "http://127.0.0.1:3001" },
  },
});
