import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { execSync } from "child_process"
import pkg from "./package.json"

const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return ""
  }
})()

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(commit ? `v${pkg.version} (${commit})` : `v${pkg.version}`),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
