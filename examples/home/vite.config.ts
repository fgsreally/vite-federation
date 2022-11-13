import { ConfigEnv, defineConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import {
  devPlugin,
  homePlugin,
  FederationResolver,
  vExtension,
} from "vite-federation";
import legacy from "@vitejs/plugin-legacy";
import Inspect from "vite-plugin-inspect";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default ({ mode }: ConfigEnv): UserConfig => {
  let plugin =
    mode === "dynamic"
      ? devPlugin({
          //when remote is in development
          remote: {
            app: "http://127.0.0.1:4000/src/micro.ts", //remote vitedevserver entry
          },
          externals: {
            vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",
            "element-plus":
              "https://cdn.bootcdn.net/ajax/libs/element-plus/2.2.12/index.full.mjs",
          },
        })
      : homePlugin({
          //when remote is bundled
          remote: {
            app: "http://127.0.0.1:8080", //remote static server
          },
          mode: mode,
          cache: true,
          importMap: true,
          types: true,
          extensions: [vExtension],
          info: false,
        });

  return {
    optimizeDeps: {
      exclude: [], //it doesn't work
    },
    server: {
      port: 4100,
    },
    plugins: [
      Inspect(),
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver(), FederationResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver(), FederationResolver()],
      }),
      plugin, // legacy()
    ],
  };
};
