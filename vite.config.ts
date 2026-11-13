import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: true,
  },
  test: {
    environment: "jsdom",
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["chart.js", "react-chartjs-2"],
          spreadsheet: ["xlsx", "papaparse"],
          supabase: ["@supabase/supabase-js"],
          router: ["react-router-dom"],
        },
      },
    },
  },
});
