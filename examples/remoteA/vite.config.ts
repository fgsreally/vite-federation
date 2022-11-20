import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { devPlugin, } from "vite-federation"

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 4000 },
  resolve: {
  },
  plugins: [vue(), devPlugin(
    {
      externals:    {
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",
        "element-plus":
          "https://cdn.bootcdn.net/ajax/libs/element-plus/2.2.12/index.full.mjs",
      }
    }
  )],
});
