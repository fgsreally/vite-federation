import { basename, relative, resolve } from "path";
import { init } from "es-module-lexer";
import type { ResolvedConfig, UserConfig } from "vite";
import { remoteConfig } from "./types";
import fs from "fs";
import fse from "fs-extra";
import contentHash from "content-hash";
import { normalizePath, PluginOption } from "vite";
import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  OutputOptions,
  InputOptions,
  NormalizedOutputOptions,
  ModuleInfo,
} from "rollup";
import {
  replaceBundleImportDeclarations,
  getModuleName,
  sendHMRInfo,
  log,
  replaceEntryFile,
  ImportExpression,
  traverseDic,
  getRelatedPath,
  getAlias,
  copySourceFile,
  isSourceFile,
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
let entryFileMap: { [key: string]: string } = {};
let metaData: any;
let alias: { name: string; url: string }[];
let sourceGraph: { [key: string]: Set<string> } = {};
let importsGraph: { [key: string]: Set<string> } = {};
// let dependenceGraph: { [key: string]: Set<string> } = {};

export default function remotePart(config: remoteConfig): PluginOption {
  // metaData = config.meta || {};
  let entryFile = config.entry || "micro.js";
  const output = config.outDir || "remote";
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
    // async options(opts: InputOptions) {

    //   if (!opts.external) opts.external = [];
    //   for (let i in config.externals) {
    //     if (!(opts.external as any).includes(i)) {
    //       (opts.external as any).push(i);
    //     }
    //   }
    // },

    //init config
    async config(opts: UserConfig) {
      await init;

      if (!opts.build) opts.build = {};
      if (!opts.build.outDir) {
        opts.build.outDir = output;
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

      if (opts.build.emptyOutDir === undefined) opts.build.emptyOutDir = false;
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
            types: config.types || false,
            project: config.HMR.projectName,
            module: updateList,
            file: normalizePath(
              relative(
                resolve(process.cwd(), entryFile, "../"),
                HMRconfig.changeFile
              )
            ),
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
    generateBundle(_: NormalizedOutputOptions, data: OutputBundle) {
      let code = ((data["remoteEntry.js"] as OutputChunk).code =
        replaceEntryFile(
          (data["remoteEntry.js"] as OutputChunk).code,
          fs.readFileSync(resolve(process.cwd(), entryFile)).toString()
        ));
      alias = ImportExpression(code);

      for (let i in data) {
        for (let entry of initEntryFiles) {
          if (basename(entry).split(".")[0] + ".js" === i) {
            let entryFilePath = (entryFileMap[getAlias(i, alias) as string] =
              getRelatedPath(
                (data[i] as OutputChunk).facadeModuleId as string

              ));
            if (!sourceGraph[entryFilePath])
              sourceGraph[entryFilePath] = new Set();
            Object.keys((data[i] as OutputChunk).modules).forEach((fp) => {
              if (isSourceFile(fp)) {
                sourceGraph[entryFilePath].add(getRelatedPath(fp));
              }
            });
            (data[i] as OutputChunk).imports.forEach((item) => {
              if (item in data) {
                Object.keys((data[item] as OutputChunk).modules).forEach((fp) => {
                  if (isSourceFile(fp)) {
                    sourceGraph[entryFilePath].add(getRelatedPath(fp))
                  }
                })
              }
            });
            Object.entries((data[i] as OutputChunk).importedBindings).forEach(
              (item) => {
                let packageName = item[0];
                if (!(packageName in data)) {
                  if (!importsGraph[packageName])
                    importsGraph[packageName] = new Set();

                  item[1].forEach((f) => importsGraph[packageName].add(f));
                }
              }
            );
          }
        }
      }

      const outputSourceGraph: { [key: string]: string[] } = {};
      const outputimportsGraph: { [key: string]: string[] } = {};
      for (let i in sourceGraph) {
        outputSourceGraph[i] = [...sourceGraph[i]];
      }
      for (let i in importsGraph) {
        outputimportsGraph[i] = [...importsGraph[i]];
      }

      metaData = {
        ...(config.meta || {}),
        timestamp: Date.now(),
        files: Object.keys(data),
        externals: Object.keys(config.externals),
        config,
        alias,
        initEntryFiles,
        entryFileMap,
        sourceGraph: outputSourceGraph,
        importsGraph: outputimportsGraph,
      };
      (this as any).emitFile({
        type: "asset",
        name: "remoteList",
        fileName: "remoteList.json",
        source: JSON.stringify(metaData),
      });

      if (config.source) {
        fse.ensureDirSync(resolve(process.cwd(), output, 'source'));
        [...new Set(Object.values(outputSourceGraph).flat())].forEach((item) => {
          copySourceFile(item, output)
        })
      }

      // if (config.importMap) return;
      // for (let i in data) {
      //   if (/.js$/.test(i)) {
      //     (data[i] as OutputChunk).code = replaceBundleImportDeclarations(
      //       (data[i] as OutputChunk).code,
      //       config.externals
      //     );
      //   }
      // }
    },

    resolveId(id: string, importer: string) {
      if (importer === normalizePath(resolve(process.cwd(), entryFile))) {
        log(`Find entry file --${id}`);
        let fileName = normalizePath(
          relative(process.cwd(), resolve(importer, "../", id))
        );
        if (!initEntryFiles.includes(fileName)) initEntryFiles.push(fileName);
      }
      if (config.importMap) {
        if (id in config.externals) return { id, external: true }
      } else {
        if (id in config.externals) return { id: config.externals[id], external: true }

      }
    },
    transform(code: string, id: string) {
      if (!id.includes("node_modules")) {
        if (/\.vue$/.test(id) && vueConfig.addTag) {
          log(`Add projectID & fileID for VUE component --${id}`);
          return (
            code +
            `\n<federation>export default (block)=>{block.projectID="${config.project || "federation-r"
            }";block.fileID="${basename(id)}";}</federation>`
          );
        }
      }
    },
  };

  const typePlugin = dts({
    //standard d.ts location
    outputDir: `${output}/types`,
    compilerOptions: { removeComments: false },
    afterBuild: () => {
      //collect all d.ts info
      traverseDic(resolve(process.cwd(), `${output}/types`), (params) => {
       fse.outputJSONSync(
          resolve(process.cwd(), `${output}/types/types.json`),
          params
        );
      });
    },
  });

  return config.types ? ([typePlugin, bundlePlugin] as any) : [bundlePlugin];
}
