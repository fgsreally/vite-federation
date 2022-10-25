import { relative, resolve } from "path";
import { init } from "es-module-lexer";
import type { ResolvedConfig } from "vite";
import { remoteConfig } from "./types";
import fs from "fs";
import contentHash from "content-hash";

import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  InputOptions,
  RollupOptions,
  OutputOptions,
} from "rollup";
import {
  replaceBundleImportDeclarations,
  cancelScoped,
  getModuleName,
  VIRTUAL_HMR_PREFIX,
  sendHMRInfo,
  log,
  replaceEntryFile,
} from "./utils";

interface HMRInfo {
  changeFile: string;
  cssFiles: { [key in string]: number };
}
let HMRconfig: HMRInfo = {
  changeFile: "",
  cssFiles: {},
};
let metaData: any;
export default function remotePart(config: remoteConfig): any {
  metaData = config.meta || {};
  let entryFile = config.entry || "micro.js";
  let vueConfig = {
    delScoped: true,
    ...config.vue,
  };
  let mode = 'build'
  // 返回的是插件对象
  return {
    name: "federation-r",
    apply: "build",
    enforce: "pre",
    async options(opts: RollupOptions) {

      await init;


      if (!opts.external) opts.external = [];
      for (let i in config.externals) {
        if (!(opts.external as any).includes(i)) {
          (opts.external as any).push(i);
        }
      }
    },

    //init config
    async config(opts: ResolvedConfig) {

      if (!opts.build.outDir) {
        opts.build.outDir = config.outDir || "remote";
      }
      if (config.cssSplit) {
        opts.build.cssCodeSplit = true;
      }
      if (!opts.build.lib) {

        opts.build.lib = {
          entry: entryFile,
          name: "remoteEntry",
          formats: ["es"],
          fileName: () => {
            return "remoteEntry.js";
          },
        };
      }
      if (!opts.build.rollupOptions) {
        opts.build.rollupOptions = {}
      }
      if (!opts.build.rollupOptions.output) {
        opts.build.rollupOptions.output = {}
      }
      (opts.build.rollupOptions.output as OutputOptions).chunkFileNames = "[name].js";
      (opts.build.rollupOptions.output as OutputOptions).assetFileNames = "[name][extname]";
    },

    watchChange(id: string, change: any) {
      if (change.event === "update") {
        HMRconfig.changeFile = id.replace(/\\/g, "/");
      }
    },

    async writeBundle(_: any, module: any) {
      let updateList: string[] = [];

      if (HMRconfig.changeFile && config.HMR) {

        for (let i in module) {
          if (
            i.endsWith(".css") //&&

            // module[i].source.length !== HMRconfig.cssFiles[i]
          ) {
            let cssHash = contentHash.encode("onion", module[i].source);
            if (cssHash !== HMRconfig.cssFiles[i]) {
              updateList.push(i);
              HMRconfig.cssFiles[i] = cssHash;
            }
          }
        }
        for (let i of module["remoteEntry.js"].dynamicImports) {
          if (HMRconfig.changeFile in module[i].modules) {
            updateList.push(getModuleName(i));
          }
        }
        try {
          let ret = await sendHMRInfo({
            url: `${config.HMR?.homePort}/${VIRTUAL_HMR_PREFIX}`,
            project: config.HMR.projectName,
            module: updateList,
            file: relative(
              resolve(process.cwd(), entryFile, "../"),
              HMRconfig.changeFile
            ).replace(/\\/g, "/"),
          });
          // let ret = await axios.get(
          //   `${config.HMR?.homePort}/${VIRTUAL_HMR_PREFIX}/!${
          //     config.HMR?.projectName
          //   }&${updateList.join("&")}`
          // );
          if (ret) {
            log("send HMR information to home ");
          } else {
            log(`fail to send HMR information\n`, "red");
          }
        } catch (e) {
          log(`fail to collect HMR information\n${e}`, "red");
        }
      } else {
        for (let i in module) {
          if (i.endsWith(".css")) {
            let cssHash = contentHash.encode("onion", module[i].source);
            HMRconfig.cssFiles[i] = cssHash;
          }

        }
      }
    },
    generateBundle(p: PluginContext, data: OutputBundle) {
      (data["remoteEntry.js"] as OutputChunk).code = replaceEntryFile((data["remoteEntry.js"] as OutputChunk).code, fs.readFileSync(resolve(process.cwd(), entryFile)).toString())

      if (config.importMap) return;
      for (let i in data) {
        if (/.js$/.test(i)) {
          (data[i] as OutputChunk).code = replaceBundleImportDeclarations(
            (data[i] as OutputChunk).code,
            config.externals
          );
        }
      }
    },

    transform(code: string, id: string) {
      if (/.vue$/.test(id) && vueConfig.delScoped) {
        log(` (.vue) remove scoped style --${id}`);
        cancelScoped(code);
      }
    },
    closeBundle() {
      let dir = resolve(process.cwd(), config.outDir || "remote");

      fs.readdir(dir, (err, files) => {
        if (err) {
          log(`write asset error`, "red");
        }
        let p = resolve(dir, "remoteList.json");
        log(`write asset list--${p}`, "green");
        metaData.files = files;
        metaData.config = config;
        fs.writeFileSync(p, JSON.stringify(metaData));
      });
    },
  };
}
