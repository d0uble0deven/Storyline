import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5175,
    proxy: {
      "/api": "http://localhost:4175",
      "/uploads": "http://localhost:4175",
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
  },
});
