import colors from "colors";
import sirv from "sirv";
import axios from "axios";
import { extname, resolve, dirname } from "path";
import URL, { fileURLToPath } from "url";
import { init } from "es-module-lexer";
import { aliasType, externals, homeConfig } from "./types";
import type { ResolvedConfig, ModuleNode, ViteDevServer, Update } from "vite";
import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  InputOptions,
} from "rollup";

import {
  replaceHotImportDeclarations,
  replaceBundleImportDeclarations,
  HMRModuleHandler,
  downloadTSFiles,
  analyseTSEntry,
  updateTSconfig,
  HMRTypesHandler,
  log,
  replaceImportDeclarations,
  resolvePathToModule,
  resolveModuleAlias,
  getHMRFilePath,
  getVirtualContent,
  resolveExtension,
} from "./utils";
import { IncomingMessage } from "http";
import { Graph } from "./graph";
import {
  VIRTUAL_PREFIX,
  FEDERATION_RE,
  VIRTUAL_EMPTY,
  TS_CONFIG_PATH,
} from "./common";
import { existsSync } from "fs-extra";
let server: ViteDevServer;
let command = "build";
const _dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
const HMRMap: Map<string, number> = new Map();
const remoteCache: any = {};
const aliasMap: { [key: string]: aliasType[] } = {};
let extensionKey: string[] = [];

function reloadModule(id: string, time: number) {
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
        moduleGraph.invalidateModule(module);

        let path = getHMRFilePath(i);
        ret.push({
          type: "js-update",
          path: path,
          acceptedPath: path,
          timestamp: time,
        });
        if (extensionKey.includes(extname(i.file as string))) {
          //vue hmr logic
          for (let j of (i as ModuleNode).importers) {
            moduleGraph.invalidateModule(j);
            let parentPath = getHMRFilePath(j);
            ret.push({
              type: "js-update",
              path: parentPath,
              acceptedPath: parentPath,
              timestamp: time,
            });
            HMRMap.set(id.split(".")[0] + extname(i.file as string), time);
          }
        }
      }
      log(`reload module ${id} --[js]`, "yellow");

      HMRMap.set(id, time);
      return ret;
    }
  }
}

async function getTypes(url: string, project: string) {
  try {
    if (existsSync(TS_CONFIG_PATH)) return;
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
  log(`--vite-federation is running--`);
  if (config.cache) log("--Use Local Cache--");
  if (config.prefetch) log(`--Use Prefetch Mode--`);
  if (config.extensions)
    extensionKey = config.extensions.map((item) => item.key);
  const graph = new Graph(Object.keys(config.remote), config.extensions || []);

  // 返回的是插件对象
  return {
    name: "vite:federation-h",
    async configResolved(resolvedConfig: ResolvedConfig) {
      command = resolvedConfig.command;
      let ext: externals = {};

      await init;
      for (let i in config.remote) {
        try {
          if (config.types) {
            getTypes(config.remote[i] + "/types/types.json", i);
          }
          //向远程请求清单
          remoteCache[i] = {};

          let remoteInfo: any = JSON.parse(
            await getVirtualContent(
              config.remote[i] + "/remoteList.json",
              i,
              "remoteList.json",
              config.cache
            )
          );
          // let { data: remoteInfo } = await axios.get();

          ext = { ...ext, ...remoteInfo.config.externals };

          aliasMap[i] = remoteInfo.alias;

          if (command !== "build") {
            log(`REMOTE MODULE (${i}) MAP:`);
            console.table(remoteInfo.alias);

            log(`REMOTE MODULE (${i}) ASSET LIST:`);
            console.table(remoteInfo.files);

            if (config.info) {
              log(`REMOTE MODULE (${i}) CONFIG`);
              console.log(remoteInfo);
            }

            if (config.prefetch) {
              for (let j of aliasMap[i]) {
                //cache
                let url = `${config.remote[i]}/${j.url}.js`;
                // let { data } = await axios.get(url);
                // log(`cache module --${i}/${j.name}`, "yellow");
                // remoteCache[i][`${j.url}.js`] = data;
                remoteCache[i][`${j.url}.js`] = await getVirtualContent(
                  url,
                  i,
                  `${j.url}.js`,
                  config.cache
                );
              }
            }
          }
        } catch (e) {
          console.log(e);
          log(`can't find remote module (${i}) -- ${config.remote[i]}`, "red");
          // process.exit(1);
        }
      }

      if (!config.externals) {
        //auto import remote config
        config.externals = ext;
        log(`FINAL EXTERNALS :`);
        console.table(config.externals);
      }
    },

    async options(opts: InputOptions) {
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
      let {
        ws,
        resolvedUrls,
        printUrls,
        config: {
          server: { https, port },
        },
      } = _server;

      server.printUrls = () => {
        const colorUrl = (url: string) =>
          colors.green(
            url.replace(/:(\d+)\//, (_, port) => `:${colors.bold(port)}/`)
          );
        const host =
          server.resolvedUrls?.local[0].replace(/\/$/, "") ||
          `${https ? "https" : "http"}://localhost:${port || "5143"}`;

        printUrls();
        // eslint-disable-next-line no-console

        console.log(
          `  ${colors.green("➜")}  ${colors.bold("Federation")}: ${colorUrl(
            `${host}/__federation/`
          )}`
        );
      };

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
      if (i.startsWith(VIRTUAL_PREFIX)) {
        id = URL.resolve(i, id);
        graph.addModule(resolvePathToModule(id), resolvePathToModule(i));
        let [project, moduleName] = resolveModuleAlias(id, aliasMap);

        let module = `!${project}/${moduleName}`;

        let query = HMRMap.has(module) ? `?t=${HMRMap.get(module)}` : "";
        return id + query;
      }

      if (FEDERATION_RE.test(id) && !id.startsWith(VIRTUAL_PREFIX)) {
        let [project, moduleName] = resolveModuleAlias(id, aliasMap);
        let module = `!${project}/${moduleName}`;
        let query = HMRMap.has(module) ? `?t=${HMRMap.get(module)}` : "";
        graph.addModule(module, resolvePathToModule(i));
        return VIRTUAL_PREFIX + `${module}${query}`;
      }
    },
    async load(id: string) {
      if (id === VIRTUAL_EMPTY) return "";

      if (id.startsWith(VIRTUAL_PREFIX)) {
        let [project, moduleName, baseName] = resolveModuleAlias(id, aliasMap);

        let ret = resolveExtension(
          config.extensions || [],
          moduleName,
          baseName
        );
        if (typeof ret === "string") return ret;

        let module = `!${project}/${moduleName}`;
        try {
          if (remoteCache[project][moduleName] && !HMRMap.has(module))
            return remoteCache[project][moduleName];

          // const { data } = await axios.get(
          //   `${config.remote[project]}/${moduleName}`
          // );
          let data = await getVirtualContent(
            `${config.remote[project]}/${moduleName}`,
            project,
            moduleName,
            config.cache && !HMRMap.has(module)
          );
          return data;
        } catch (e) {
          log(
            `Request module was not found, returns an empty module--${config.remote[project]}/${moduleName}`,
            "grey"
          );

          return "";
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
        if (config.mode === "hot" && command === "build") {
          code = replaceHotImportDeclarations(code, config, aliasMap);
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
      }
    },
  };
}
