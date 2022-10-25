import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { devPlugin, homePlugin } from "vite-federation";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4100,
  },
  plugins: [
    vue(),
    // devPlugin(
    //   {
    //     remote:{
    //       app:"http://127.0.0.1:4000/src/micro.ts"
    //     },
    //     externals: {
    //       vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js", "element-plus":
    //         "https://cdn.bootcdn.net/ajax/libs/element-plus/2.2.12/index.full.mjs",
    //     }
    //   }
    // )
    homePlugin({
      remote: {
        app: "http://127.0.0.1:8080",
      },
      mode: "cold",
      cache: false,
      importMap: false,
      types: true,
      info: false,
    }),
  ],
});
