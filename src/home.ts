import fs from "fs";
import sirv from "sirv";
import axios from "axios";
import { basename, extname, relative, resolve, dirname } from "path";
import URL, { fileURLToPath } from "url";
import { init } from "es-module-lexer";
import { externals, homeConfig, remoteListType, VisModuleGraph } from "./types";
import type { ResolvedConfig, ModuleNode, ViteDevServer, Update } from "vite";
import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  InputOptions,
} from "rollup";

import {
  getAbsolutePath,
  normalizeFileName,
  getFileName,
  replaceHotImportDeclarations,
  replaceBundleImportDeclarations,
  HMRModuleHandler,
  replaceHMRImportDeclarations,
  downloadTSFiles,
  analyseTSEntry,
  updateTSconfig,
  HMRTypesHandler,
  log,
  vueExtension,
  replaceImportDeclarations,
  resolvePathToModule,
} from "./utils";
import { IncomingMessage } from "http";
import { Graph } from "./graph";
import { VIRTUAL_PREFIX, FEDERATION_RE, VIRTUAL_EMPTY } from "./common";
let server: ViteDevServer;
let command = "build";

const HMRMap: Map<string, number> = new Map();
const remoteCache: any = {};
const remoteList: remoteListType = {};
const _dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
function reloadModule(id: string, time: number) {
  ///@virtual:vite-federation/!app/App
  const { moduleGraph } = server;
  const module = moduleGraph.getModuleById(VIRTUAL_PREFIX + id);

  if (module) {
    if (id.endsWith(".css")) {
      log(`reload module ${id} --[css]`, "yellow");
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
      log(`reload module ${id} --[js]`, "yellow");

      HMRMap.set(id, time);
      return ret;
    }
  }
}

async function getTypes(url: string, project: string) {
  try {
    let entryFileCode = await downloadTSFiles(url, project);

    if (entryFileCode) {
      let ret = await analyseTSEntry(entryFileCode as string);

      updateTSconfig(project, ret);
    }
  } catch (e) {
    log(
      `can't find remote module (${project}) type declaration (it should be at "/types/types.json")`,
      "red"
    );
  }
}

export default function HomePlugin(config: homeConfig): any {
  let compList: any = {};
  let vueConfig = {
    resolve: true,
    ...config.vue,
  };
  const graph = new Graph(Object.keys(config.remote));

  // 返回的是插件对象
  return {
    name: "federation-h",

    configResolved(resolvedConfig: ResolvedConfig) {
      log(`--vite-federation is running--`);

      command = resolvedConfig.command;
    },

    async options(opts: InputOptions) {
      let ext: externals = {};

      await init;
      for (let i in config.remote) {
        try {
          //向远程请求清单
          compList[i] = [];
          remoteCache[i] = {};

          let { data: remoteInfo } = await axios.get(
            config.remote[i] + "/remoteList.json"
          );

          ext = { ...ext, ...remoteInfo.config.externals };

          if (config.types) {
            getTypes(config.remote[i] + "/types/types.json", i);
          }
          if (command !== "build") {
            log(`REMOTE MODULE (${i}) MAP:`);
            console.table(remoteInfo.alias);

            log(`REMOTE MODULE (${i}) ASSET LIST:`);
            console.table(remoteInfo.files);

            if (config.info) {
              log(`REMOTE MODULE (${i}) CONFIG`);
              console.log(remoteInfo);
            }
          }
          remoteList[i] = remoteInfo.alias;

          if (!config.cache) break;

          for (let j of remoteList[i]) {
            //请求清单上js文件并缓存
            let url = getAbsolutePath(config.remote[i], j.url);

            if (!url) break;

            let fileName = getFileName(j.url);
            let { data } = await axios.get(url);

            remoteCache[i][fileName] = data;
            compList[i].push(fileName);
          }
        } catch (e) {
          log(`can't find remote module (${i}) -- ${config.remote[i]}`, "red");
          // process.exit(1);
        }
      }

      if (!config.externals && command !== "build") {
        //auto import remote config
        config.externals = ext;
        log(`FINAL EXTERNALS :`);
        console.table(config.externals);
      }
      //补充external,也可以在rollupOption中弄
      if (!opts.external) opts.external = [];
      for (let i in config.externals) {
        if (!(opts.external as string[]).includes(i)) {
          (opts.external as string[]).push(i);
        }
      }
    },

    configureServer(_server: ViteDevServer) {
      server = _server;
      let { ws } = _server;

      server.middlewares.use(
        "/__federation",
        sirv(resolve(_dirname, "./client"), {
          single: true,
          dev: true,
        })
      );
      server.middlewares.use("/__federation_api", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(graph.generate(), null, 2));
        res.end();
      });
      server.middlewares.use((req: IncomingMessage, res, next) => {
        let url = req.url || "";
        try {
          let ret = HMRModuleHandler(url);

          if (ret) {
            HMRTypesHandler(url, config.remote);
            let time = Date.now();
            let allUpdateModule = (ret as string[])
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
    async resolveId(id: string, i: string) {
      // /^\!(.*)\/(.*)$/
      if (i.startsWith(VIRTUAL_PREFIX)) {
        graph.addModule(
          resolvePathToModule(URL.resolve(i, id)),
          resolvePathToModule(i)
        );

        return URL.resolve(i, id);
      }

      if (FEDERATION_RE.test(id) && !id.startsWith(VIRTUAL_PREFIX)) {
        let source = id.match(FEDERATION_RE) as string[];
        let projectName = source[1];
        let moduleName = source[2];

        if (remoteList[projectName]) {
          for (let i of remoteList[projectName]) {
            if (i.name === moduleName.split(".")[0]) {
              moduleName =
                basename(i.url, ".js") +
                (moduleName.split(".")[1]
                  ? "." + moduleName.split(".")[1]
                  : "");
              break;
            }
          }
        }

        graph.addModule(resolvePathToModule(id), resolvePathToModule(i));

        if (!config.cache) return VIRTUAL_PREFIX + id;
        if (remoteCache[projectName][normalizeFileName(moduleName)]) {
          return VIRTUAL_PREFIX + id;
        } else {
          try {
            const ret = await axios.get(
              `${config.remote[projectName]}/${normalizeFileName(moduleName)}`
            );
            remoteCache[projectName][normalizeFileName(moduleName)] = ret.data;
            return VIRTUAL_PREFIX + id;
          } catch (e) {
            log(
              `Request module was not found, returns an empty module--${
                config.remote[projectName]
              }/${normalizeFileName(moduleName)} `,
              "grey"
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

        if (id.endsWith(".vue")) return "";

        if (FEDERATION_RE.test(id)) {
          let source = id.match(FEDERATION_RE) as string[];
          let projectName = source[1];
          let moduleName = source[2];

          //alias
          if (remoteList[projectName]) {
            for (let i of remoteList[projectName]) {
              if (i.name === moduleName.split(".")[0]) {
                moduleName =
                  basename(i.url, ".js") +
                  (moduleName.split(".")[1]
                    ? "." + moduleName.split(".")[1]
                    : "");
                break;
              }
            }
          }

          if (!config.cache) {
            try {
              const { data } = await axios.get(
                `${config.remote[projectName]}/${normalizeFileName(moduleName)}`
              );
              return data;
            } catch (e) {
              log(
                `Request module was not found, returns an empty module--${
                  config.remote[projectName]
                }/${normalizeFileName(moduleName)}`,
                "grey"
              );

              return "";
            }
          }
          const fileName = normalizeFileName(moduleName);

          if (!source || !remoteCache[projectName][fileName]) return;
          if (extname(fileName) === ".js")
            return remoteCache[projectName][fileName];
          // return replaceImportDeclarations(
          //   remoteCache[projectName][fileName],
          //   config.externals,
          //   projectName
          // );
          if (extname(fileName) === ".css") {
            return remoteCache[projectName][fileName];
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
            config.externals as externals
          );
        }
      }
    },

    transform(code: any, id: string) {
      if (
        id.startsWith(VIRTUAL_PREFIX) &&
        !id.endsWith(".css") &&
        !config.importMap &&
        command !== "build"
      ) {
        code = replaceImportDeclarations(code, config.externals as externals);
        return code;
      }
      if (
        /src(.*)\.(vue|js|ts|jsx|tsx)$/.test(id) &&
        !/node_modules\//.test(id)
      ) {
        if (vueConfig.resolve) code = vueExtension(code);
        if (!config.cache && command !== "build") {
          code = replaceHMRImportDeclarations(code, HMRMap);
        }

        if (config.mode === "hot" && command === "build") {
          code = replaceHotImportDeclarations(code, config);
        }
        return code;
      }
    },
    transformIndexHtml(html: string) {
      if (config.importMap && command === "build") {
        return {
          html,
          tags: [
            {
              //polyfill
              tag: "script",
              attrs: {
                async: true,
                src: "https://ga.jspm.io/npm:es-module-shims@1.6.2/dist/es-module-shims.js",
              },
              injectTo: "head-prepend",
            },
            {
              tag: "script",
              attrs: {
                type: "importmap", //systemjs-importmap
              },
              children: `{"imports":${JSON.stringify(config.externals)}}`,
              injectTo: "head-prepend",
            },
          ],
        };
        // return html.replace(
        //   /<title>(.*?)<\/title>/,
        //   (_: string, js: string) => {
        //     return (
        //       _ +
        //       `\n<script type="importmap">
        //     {
        //       "imports":${JSON.stringify(config.externals)}
        //     }
        //     </script>`
        //     );
        //   }
        // );
      }
    },
  };
}
