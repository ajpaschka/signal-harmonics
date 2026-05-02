import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/signal-harmonics/",
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
});
