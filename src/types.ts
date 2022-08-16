export interface externals {
  [key: string]: string;
}

export interface remoteConfig {
  outDir?: string;
  entry?: string;
  externals: externals;
  version?: number;
  importMap: boolean;
  HMR?: {
    projectName?: string;
    homePort?: string;
  };
}
// const config: any = {
//   externals: {
//     vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",
//   },
//   remote: {
//     app: "http://127.0.0.1:8081",
//   },
//   mode: "hot",
//   cssSplit: true,
//   initFileList: [],
// };

export interface homeConfig {
  externals: externals;
  version?: number;
  remote: externals;
  mode: "hot" | "cold";
  cssSplit: string[] | false;
  initFileList: string[];
  cache: boolean;
  importMap: boolean;
}

// if (module) {
//   console.log(colors.yellow(`reload module ${id}`));
//   for (let i of (module as ModuleNode).importers) {
//     moduleGraph.invalidateModule(i);
//   }
//   moduleGraph.invalidateModule(module);
//   if (ws) {
//     let t = Date.now();
//     curTime = t;
//     ws.send({
//       type: "update",
//       updates: [
//         {
//           type: "js-update",
//           path: "/src/components/example.vue",
//           acceptedPath: "/@virtual:vite-federation/!app/App",
//           timestamp: t,
//         },
//         {
//           type: "js-update",
//           path: "/src/components/example.vue",
//           acceptedPath: "/src/components/example.vue",
//           timestamp: t,
//         },
//       ],
//     });
//     HMRMap.set("!app/App", t);
//   }
// }
// }
