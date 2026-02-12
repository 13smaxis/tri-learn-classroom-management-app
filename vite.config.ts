import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a temp directory for Vite's dep cache to avoid OneDrive file-locking issues
const viteCacheDir = path.join(os.tmpdir(), "vite-tri-learn-app");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: viteCacheDir,
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
