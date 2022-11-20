import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { remotePlugin, esmsh } from "vite-federation";

import visualizer from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    //@ts-ignore
    visualizer(),
    //just output d.ts
    // dts({
    //   //standard d.ts location
    //   outputDir: "remote/types",
    //   compilerOptions: { removeComments: false },
    //   afterBuild: () => {
    //     //collect all d.ts info
    //     traverseDic(resolve(process.cwd(), "remote/types"), (params) => {
    //       outputJSONSync(
    //         resolve(process.cwd(), "remote/types/types.json"),
    //         params
    //       );
    //     });
    //   },
    // }),

    remotePlugin({
      entry: "src/micro.ts", //if use typescript,fileName must be micro.ts
      externals: esmsh(["vue", "element-plus"]),
      types: false,
      HMR: {
        projectName: "app",
        homePort: "http://localhost:4100",
      },
      source: true,
      cssSplit: true,
      importMap: true, //Negative if home is esm but not importmap
    }),
    ,
  ],
});
