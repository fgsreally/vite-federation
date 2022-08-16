import { init } from "es-module-lexer";
import type { ResolvedConfig } from "vite";
import { remoteConfig } from "./types";
import colors from "colors";
import axios from "axios";
import type {
  PluginContext,
  OutputBundle,
  OutputChunk,
  InputOptions,
} from "rollup";
import {
  replaceBundleImportDeclarations,
  cancelScoped,
  getModuleName,
  VIRTUAL_HMR_PREFIX,
} from "./utils";

interface HMRInfo {
  changeFile: string;
  cssFiles: { [key in string]: number };
}
let HMRconfig: HMRInfo = {
  changeFile: "",
  cssFiles: {},
};
export default function remotePart(config: remoteConfig): any {
  // 返回的是插件对象
  return {
    name: "federation-r",
    // enforce: "pre",
    options(opts: InputOptions) {
      if (!opts.external) opts.external = [];
      for (let i in config.externals) {
        if (!(opts.external as any).includes(i)) {
          (opts.external as any).push(i);
        }
      }
    },

    // vite特有钩子
    async config(opts: ResolvedConfig) {
      await init;
      if (!opts.build.outDir) {
        opts.build.outDir = config.outDir || "remote";
      }
      if (!opts.build.lib) {
        opts.build.lib = {
          entry: config.entry || "micro.js",
          name: "remoteEntry",
          formats: ["es"],
          fileName: () => {
            return "remoteEntry.js";
          },
        };
      }
    },
    watchChange(id: string, change: any) {
      if (change.event === "update") {
        HMRconfig.changeFile = id.replace(/\\/g, "/");
      }
    },

    async writeBundle(_: any, module: any) {
      let updateList: string[] = [];

      if (HMRconfig.changeFile) {
        // if (module["style.css"].source.length !== HMRconfig.cssFileLength) {
        //   updateList.push("style.css");
        // }
        for (let i in module) {
          if (
            i.endsWith(".css") &&
            module[i].source.length !== HMRconfig.cssFiles[i]
          ) {
            updateList.push(i);
            HMRconfig.cssFiles[i] = module[i].source.length;
          }
        }
        for (let i of module["remoteEntry.js"].dynamicImports) {
          if (HMRconfig.changeFile in module[i].modules) {
            updateList.push(getModuleName(i));
          }
        }
        try {
          let ret = await axios.get(
            `${config.HMR?.homePort}/${VIRTUAL_HMR_PREFIX}/!${
              config.HMR?.projectName
            }&${updateList.join("&")}`
          );
          if (ret) {
            console.log(colors.cyan("send HMR information to home center"));
          } else {
            console.log(colors.red(`fail to send HMR information\n`));
          }
        } catch (e) {
          console.log(colors.red(`fail to collect HMR information fail\n${e}`));
        }
      } else {
        for (let i in module) {
          if (i.endsWith(".css")) {
            HMRconfig.cssFiles[i] = module[i].source.length;
          }
        }
      }
    },
    generateBundle(p: PluginContext, data: OutputBundle) {
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
      if (/.vue$/.test(id)) {
        console.log(
          colors.cyan(`\n${id} remove scoped style --[vue component]`)
        );
        cancelScoped(code);
      }
    },
  };
}
