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
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
