import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { homePlugin } from "vite-federation";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    homePlugin({
      remote: {
        app: "http://127.0.0.1:8080",
      },
      mode: "hot",
      cache: false,
      cssSplit: [],
      initFileList: [],
      importMap: true,
      types: true, //it will rewrite all d.ts
      info: false,
    }),
  ],
});


