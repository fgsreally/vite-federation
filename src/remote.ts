import { basename, relative, resolve } from "path";
import { init } from "es-module-lexer";
import type { ResolvedConfig } from "vite";
import { remoteConfig } from "./types";
import fs from "fs";
import fse, { outputJSONSync } from "fs-extra";
import contentHash from "content-hash";
import { normalizePath } from "vite";
import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  RollupOptions,
  OutputOptions,
} from "rollup";
import {
  replaceBundleImportDeclarations,
  getModuleName,
  sendHMRInfo,
  log,
  replaceEntryFile,
  ImportExpression,
  traverseDic,
} from "./utils";

import { VIRTUAL_HMR_PREFIX } from "./common";
import dts from "vite-plugin-dts";
interface HMRInfo {
  changeFile: string;
  cssFiles: { [key in string]: number };
}
let HMRconfig: HMRInfo = {
  changeFile: "",
  cssFiles: {},
};
let initEntryFiles: string[] = [];
let metaData: any;
let alias: { name: string; url: string }[];
let sourceGraph: { [key: string]: string[] } = {};
export default function remotePart(config: remoteConfig): any {
  metaData = config.meta || {};
  let entryFile = config.entry || "micro.js";
  let vueConfig = {
    delScoped: true,
    addTag: true,
    ...config.vue,
  };
  // 返回的是插件对象
  const bundlePlugin = {
    name: "vite:federation-r",
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
        opts.build.rollupOptions = {};
      }
      if (!opts.build.rollupOptions.output) {
        opts.build.rollupOptions.output = {};
      }
      (opts.build.rollupOptions.output as OutputOptions).chunkFileNames =
        "[name].js";
      (opts.build.rollupOptions.output as OutputOptions).assetFileNames =
        "[name][extname]";
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
          if (i.endsWith(".css")) {
            let cssHash = contentHash.encode("onion", module[i].source);
            if (cssHash !== HMRconfig.cssFiles[i]) {
              updateList.push(i);
              HMRconfig.cssFiles[i] = cssHash;
            }
          }
        }
        for (let i of module["remoteEntry.js"].dynamicImports) {
          if (HMRconfig.changeFile in module[i].modules) {
            updateList.push(i);
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
            log("Send HMR information to home ");
          } else {
            log(`Fail to send HMR information\n`, "red");
          }
        } catch (e) {
          log(`Fail to collect HMR information\n${e}`, "red");
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
      let code = ((data["remoteEntry.js"] as OutputChunk).code =
        replaceEntryFile(
          (data["remoteEntry.js"] as OutputChunk).code,
          fs.readFileSync(resolve(process.cwd(), entryFile)).toString()
        ));
      alias = ImportExpression(code);

      for (let i in data) {
        for (let entry of initEntryFiles) {
          if (basename(entry).split(".")[0] + ".js" === i) {
            Object.keys((data[i] as OutputChunk).modules).forEach((fp) => {
              if (fse.existsSync(fp) && !fp.includes("node_modules")) {
                sourceGraph[normalizePath(entry)].push(
                  normalizePath(relative(process.cwd(), fp))
                );
              }
            });
          }
        }
      }

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

    resolveId(id: string, importer: string) {
      if (importer === resolve(process.cwd(), entryFile).replace(/\\/g, "/")) {
        log(`Remote entry file --${id}`);
        let fileName = normalizePath(
          relative(process.cwd(), resolve(importer, id))
        );
        sourceGraph[fileName] = [];
        initEntryFiles.push(fileName);
      }
    },
    transform(code: string, id: string) {
      if (!id.includes("node_modules")) {
        if (/\.vue$/.test(id) && vueConfig.addTag) {
          log(`Add projectID & fileID for VUE component --${id}`);
          return (
            code +
            `\n<federation>export default (block)=>{block.projectID="${
              config.project || "federation-r"
            }";block.fileID="${basename(id)}";}</federation>`
          );
          // log(` (.vue) remove scoped style --${id}`);
          // cancelScoped(code);
        }
      }
    },

    closeBundle() {
      let dir = resolve(process.cwd(), config.outDir || "remote");

      fs.readdir(dir, (err, files) => {
        if (err) {
          log(`Write asset error`, "red");
        }
        let p = resolve(dir, "remoteList.json");
        log(`Write asset list--${p}`, "green");
        metaData.files = files;
        metaData.config = config;
        metaData.initEntryFiles = initEntryFiles;
        metaData.alias = alias;
        metaData.sourceGraph = sourceGraph;
        fse.outputJSON(p, metaData);
      });
    },
  };

  const typePlugin = dts({
    //standard d.ts location
    outputDir: "remote/types",
    compilerOptions: { removeComments: false },
    afterBuild: () => {
      //collect all d.ts info
      traverseDic(resolve(process.cwd(), "remote/types"), (params) => {
        outputJSONSync(
          resolve(process.cwd(), "remote/types/types.json"),
          params
        );
      });
    },
  });

  return config.types ? [typePlugin, bundlePlugin] : [bundlePlugin];
}
