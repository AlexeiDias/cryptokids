import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      stream: path.resolve(__dirname, "node_modules/stream-browserify"),
      crypto: path.resolve(__dirname, "node_modules/crypto-browserify"),
      buffer: path.resolve(__dirname, "node_modules/buffer"),
      process: path.resolve(__dirname, "node_modules/process/browser"),
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer", "process", "stream-browserify", "crypto-browserify"],
  },
});
