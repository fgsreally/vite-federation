import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { homePlugin } from "vite-federation";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      isProduction: false,
    }),
    homePlugin({
      externals: {
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",
        "element-plus":
          "https://cdn.bootcdn.net/ajax/libs/element-plus/2.2.12/index.full.mjs",
      },
      remote: {
        app: "http://127.0.0.1:8080",
      },
      mode: "cold",
      cache: false,
      cssSplit: ["app"],
      initFileList: [],
      importMap: true,
    }),
  ],
});

// {
//   externals: {
//     vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",
//   },
//   remote: {
//     app: "http://127.0.0.1:8080",
//   },
//   mode: "hot",
//   cssSplit: true,
//   initFileList: [],
// }
