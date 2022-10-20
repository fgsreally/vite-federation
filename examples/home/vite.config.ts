import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { homePlugin } from "vite-federation";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4100,
  },
  plugins: [
    vue(),
    homePlugin({
      remote: {
        app: "http://127.0.0.1:8081",
      },
      mode: "hot",
      cache: false,
      importMap: true,
      types: true,
      info: false,
    }),
  ],
});
