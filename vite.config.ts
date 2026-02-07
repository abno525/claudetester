import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/client/index.ts"),
      name: "MinecraftCaptcha",
      fileName: "minecraft-captcha",
      formats: ["es", "umd"],
    },
    outDir: "dist/widget",
    rollupOptions: {
      output: {
        assetFileNames: "minecraft-captcha.[ext]",
      },
    },
  },
  root: ".",
  publicDir: "public",
  server: {
    // Dev-only: proxy API requests to the Express server running on port 3000.
    // In production the Express server serves both the API and the built widget.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
