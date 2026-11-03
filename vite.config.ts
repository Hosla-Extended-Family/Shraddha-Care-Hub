
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      png: {
        quality: 65,
        compressionLevel: 9,
        palette: true,
      },
      jpeg: {
        quality: 65,
        progressive: true,
      },
      jpg: {
        quality: 65,
        progressive: true,
      },
      webp: {
        lossless: false,
        quality: 65,
        alphaQuality: 65,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
