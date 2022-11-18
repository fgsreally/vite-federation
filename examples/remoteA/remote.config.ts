import { outputJSONSync } from "fs-extra";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { remotePlugin, esmsh } from "vite-federation";
import dts from "vite-plugin-dts";
import { resolve } from "path";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
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
      cssSplit: true,
      importMap: true, //Negative if home is esm but not importmap
    }),
    ,
  ],
});
