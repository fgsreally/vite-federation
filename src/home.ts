import fs from "fs";
import colors from "colors";
import axios from "axios";
import { extname, relative } from "path";
import { init } from "es-module-lexer";
import { homeConfig } from "./types";
import type {
  PluginOption,
  ResolvedConfig,
  ModuleNode,
  ModuleGraph,
  ViteDevServer,
  Update,
} from "vite";
import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  InputOptions,
} from "rollup";

import {
  ImportExpression,
  getAbsolutePath,
  normalizeFileName,
  getFileName,
  replaceImportDeclarations,
  replaceHotImportDeclarations,
  replaceBundleImportDeclarations,
  addSplitCss,
  VIRTUAL_PREFIX,
  HMRHandler,
  replaceHMRImportDeclarations,
  VIRTUAL_EMPTY,
} from "./utils";
import { IncomingMessage } from "http";
let k = 0;
const deps = [];
let remoteSet: Set<string> = new Set();
let HMRMap: Map<string, number> = new Map();
const cdn = [];
let mode = "build";
const remoteCache: any = {};
let server: ViteDevServer;
let curTime: number;
function reloadModule(id: string, time: number) {
  ///@virtual:vite-federation/!app/App
  const { moduleGraph } = server;
  const module = moduleGraph.getModuleById(VIRTUAL_PREFIX + id);

  if (module) {
    if (id.endsWith(".css")) {
      console.log(colors.yellow(`reload module ${id} --[css]`));

      moduleGraph.invalidateModule(module);

      HMRMap.set(id, time);
      return [
        {
          type: "js-update",
          path: VIRTUAL_PREFIX + id,
          acceptedPath: VIRTUAL_PREFIX + id,
          timestamp: time,
        },
      ];
    } else {
      let ret = [];
      for (let i of (module as ModuleNode).importers) {
        moduleGraph.invalidateModule(i);
        let path =
          "/" + relative(process.cwd(), i?.file || "").replace(/\\/g, "/");
        ret.push({
          type: "js-update",
          path: path,
          acceptedPath: path,
          timestamp: time,
        });
      }
      moduleGraph.invalidateModule(module);
      console.log(colors.yellow(`reload module ${id} --[js]`));
      HMRMap.set(id, time);
      return ret;
    }
  }
}

export default function myExample(config: homeConfig): any {
  let compList: any = {};
  // 返回的是插件对象
  return {
    name: "federation-h",
    // 初始化hooks，只走一次
    async options(opts: InputOptions) {
      //补充external,也可以在rollupOption中弄
      if (!opts.external) opts.external = [];
      for (let i in config.externals) {
        if (!(opts.external as string[]).includes(i)) {
          (opts.external as string[]).push(i);
        }
      }
      for (let i in config.externals) {
        cdn.push(config.externals[i]);
      }
      if (!config.cache) return;
      await init;
      for (let i in config.remote) {
        //向远程请求清单
        compList[i] = [];
        remoteCache[i] = {};
        let { data: entryRet } = await axios.get(
          config.remote[i] + "/remoteEntry.js"
        );
        let entryList = ImportExpression(entryRet);

        for (let j of entryList) {
          //请求清单上js文件并缓存
          let url = getAbsolutePath(config.remote[i], j);
          if (!url) break;

          let fileName = getFileName(j);
          let { data } = await axios.get(url);
          remoteCache[i][fileName] = data;
          compList[i].push(fileName);
        }
      }
    },
    configResolved(resolvedConfig: ResolvedConfig) {
      mode = resolvedConfig.command;
    },

    configureServer(_server: ViteDevServer) {
      server = _server;
      let { ws } = _server;
      _server.middlewares.use((req: IncomingMessage, res, next) => {
        let url = req.url || "";
        try {
          let ret = HMRHandler(url);

          let time = Date.now();
          if (ret) {
            let allUpdateModule = ret
              .map((item) => reloadModule(item, time))
              .flat()
              .filter((i) => i) as unknown;
            ws.send({ type: "update", updates: allUpdateModule as Update[] });
            res.end("1");
          } else {
            next();
          }
        } catch (e) {
          console.error(e);
        }
      });
    },
    async resolveId(id: string, i: any) {
      // /^\!(.*)\/(.*)$/
      let source = id.match(/^\!(.*)\/([^?]*)/);
      if (source && source[1] && source[2]) {
        remoteSet.add(id);
        if (!config.cache) return VIRTUAL_PREFIX + id;
        if (remoteCache[source[1]][normalizeFileName(source[2])]) {
          deps.push(i);
          return VIRTUAL_PREFIX + id;
        } else {
          try {
            const ret = await axios.get(
              `${config.remote[source[1]]}/${normalizeFileName(source[2])}`
            );
            remoteCache[source[1]][normalizeFileName(source[2])] = ret.data;
            return VIRTUAL_PREFIX + id;
          } catch (e) {
            console.log(
              colors.grey(
                `请求模块${config.remote[source[1]]}/${normalizeFileName(
                  source[2]
                )}不存在，返回空模块`
              )
            );
            return VIRTUAL_EMPTY;
          }
        }
      }
    },
    async load(id: string) {
      if (id === VIRTUAL_EMPTY) return "";
      if (id.startsWith(VIRTUAL_PREFIX)) {
        // let source = id.match(/^\0\@(.*)\/(.*)$/);
        let source = id.match(/\!(.*)\/([^?]*)/);

        if (source && source[1] && source[2]) {
          if (!config.cache) {
            const { data } = await axios.get(
              `${config.remote[source[1]]}/${normalizeFileName(source[2])}`
            );

            return replaceImportDeclarations(data, config.externals, source[1]);
          }
          const fileName = normalizeFileName(source[2]);

          if (!source || !remoteCache[source[1]][fileName]) return;
          if (extname(fileName) === ".js")
            return replaceImportDeclarations(
              remoteCache[source[1]][fileName],
              config.externals,
              source[1]
            );
          if (extname(fileName) === ".css") {
            return remoteCache[source[1]][fileName];
          }
        }
      }
    },
    generateBundle(p: PluginContext, data: OutputBundle) {
      if (config.importMap) return;
      for (let i in data) {
        if (/\.js$/.test(i)) {
          (data[i] as OutputChunk).code = replaceBundleImportDeclarations(
            (data[i] as OutputChunk).code,
            config.externals
          );
        }
      }
    },

    transform(code: any, id: string) {
      if (
        /src(.*)\.(vue|js|ts|jsx|tsx)$/.test(id) &&
        !/node_modules\//.test(id)
      ) {
        if (!config.cache && mode !== "build") {
          code = replaceHMRImportDeclarations(code, HMRMap);
        }
        if (Array.isArray(config.cssSplit)) {
          code = addSplitCss(code, config);
        }

        if (config.mode === "hot" && mode === "build") {
          code = replaceHotImportDeclarations(code, config);
        }
        return code;
      }
    },
    transformIndexHtml(html: string) {
      if (config.importMap) {
        return html.replace(
          /<title>(.*?)<\/title>/,
          (_: string, js: string) => {
            return (
              _ +
              `\n<script type="importmap">
            {
              "imports":${JSON.stringify(config.externals)}
            }
            </script>`
            );
          }
        );
      }
    },
  };
}

// if (
//   /src(.*)\.(vue|js|ts|jsx|tsx)$/.test(id) &&
//   !/node_modules\//.test(id)
// ) {
//   if (/\.vue$/.test(id)) {
//     code = code.replace(
//       /(<script.*?>)(.*)<\/script>/gim,
//       function (_: string, p1: string, p2: string) {
//         let ret = "";
//         if (Array.isArray(config.cssSplit)) ret = addSplitCss(p2, config);
//         if (config.mode === "hot" && mode === "build") {
//           code = replaceHotImportDeclarations(ret, config);
//         }
//         return `${p1}${ret}</script>`;
//       }
//     );
//   } else {
//     if (Array.isArray(config.cssSplit)) code = addSplitCss(code, config);
//     if (config.mode === "hot" && mode === "build") {
//       code = replaceHotImportDeclarations(code, config);
//     }
//   }

//   return code;
// }
