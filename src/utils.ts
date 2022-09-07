import axios from "axios";
import path from "path";
import URL from "url";
import { ImportSpecifier, parse } from "es-module-lexer";
import { homeConfig, externals, remoteListType, ModulePathMap } from "./types";
import colors, { Color } from "colors";
import fs from "fs";
import { outputFileSync, outputJSONSync, readJsonSync } from "fs-extra";

export const VIRTUAL_PREFIX = "/@virtual:vite-federation/";
export const VIRTUAL_EMPTY = "/@virtual:EmptyModule";
export const VIRTUAL_HMR_PREFIX = "VIRTUAL-HMR";
export const TYPES_CACHE = path.resolve(__dirname, "../", "types");
const HMT_TYPES_TIMEOUT = 5000;

export function HMRModuleHandler(url: string) {
  let ret = resolveURLQuery(url) as any;
  if (ret) {
    return ret.module.map((item: string) => `!${ret.project}/${item}`);
  }
}

export function HMRTypesHandler(url: string, remoteConfig: externals) {
  let { file, project } = resolveURLQuery(url) as any;
  if (file.endsWith(".ts")) {
    setTimeout(() => {
      updateTypesFile(
        URL.resolve(remoteConfig[project], "types/"),
        project,
        file.replace(/\.ts$/, ".d.ts")
      );
    }, HMT_TYPES_TIMEOUT);
  }
}

// export function replaceStr2(
//   str: string,
//   first: number,
//   last: number,
//   char: string
// ): string {
//   return str.substring(0, first) + char + str.substring(last);
// }

export function cancelScoped(source: string): string {
  let newSource = source.replace(/<style.*?>([\s\S]+?)<\/style>/, (_, js) => {
    return js;
  });
  return `<style>${newSource}</style>`;
}

export function getAbsolutePath(url: string, rel: string) {
  if (/^\.\//.test(rel)) {
    return url + rel.substring(1);
  }
  return false;
}
export function getFileName(rel: string) {
  return rel.substring(2);
}
export function normalizeFileName(name: string) {
  return `${name}${path.extname(name) ? "" : ".js"}`;
}

export function replaceImportDeclarations(
  source: any,
  externals: { [x: string]: any; vue?: string },
  project: any
) {
  let newSource = source;
  const [imports] = parse(source, "optional-sourcename");
  for (let i of imports as any) {
    if (/^\.\//.test(i.n)) {
      newSource = newSource.replace(
        i.n,
        `!${project}/${getFileName(i.n).replace(/\.js$/, "")}`
      );
    }
    for (let j in externals) {
      if (i.n === externals[j]) {
        newSource = newSource.replace(i.n, j);

        break;
      }
    }
  }

  return newSource;
}

export function ImportExpression(source: string) {
  const [imports, exports] = parse(source, "optional-sourcename");
  return imports.map((item, i) => {
    return { url: item.n as string, name: exports[i] };
  });
}
export function replaceHMRImportDeclarations(
  source: string,
  HMRMap: Map<string, number>
) {
  const [imports] = parse(source, "optional-sourcename");

  for (let i of imports as any) {
    if (/^\!(.*)\/([^?]*)/.test(i.n) && HMRMap.has(i.n)) {
      source = source.replace(i.n, i.n + `?t=${HMRMap.get(i.n)}`);
    }
  }
  return source;
}

export function replaceHotImportDeclarations(source: any, config: homeConfig) {
  const [imports] = parse(source, "optional-sourcename");
  let newSource = source;
  let cssImports = "";
  for (let i of imports as any) {
    let ret = i.n.match(/^\!(.*)\/(.*)$/);

    if (ret && ret[1] && ret[2]) {
      let fileName = normalizeFileName(ret[2]);
      if (path.extname(fileName) === ".js")
        newSource = newSource.replace(
          i.n,
          config.remote[ret[1]] + `/${fileName}`
        );
      if (path.extname(fileName) === ".css") {
        cssImports = `loadCss("${config.remote[ret[1]]}/${fileName}")`;
        newSource = newSource.replace(newSource.substring(i.ss, i.se), "");
      }
    }
  }
  if (cssImports) {
    newSource =
      newSource +
      `export function loadCss(url){
      let css = document.createElement('link');
      css.href = url;
      css.rel = 'stylesheet';
      css.type = 'text/css';
      document.head.appendChild(css);
    };` +
      cssImports;
  }
  return newSource;
}
// export function replaceBundleImportDeclarations(
//   source: any,
//   externals: { [x: string]: any; vue?: string }
// ) {
//   const [imports] = parse(source, "optional-sourcename");
//   let newSource = source;
//   for (let i of imports) {
//     for (let j in externals) {
//       if (i.n === j) {
//         newSource = newSource.replace(i.n, externals[j]);
//         break;
//       }
//     }
//   }
//   return newSource;
// }

export function replaceBundleImportDeclarations(
  source: string,
  externals: externals
) {
  const [imports] = parse(source, "optional-sourcename");
  let newSource = ``;
  // let newSource = source;
  let replacement: [ImportSpecifier, string][] = [];

  for (let i of imports) {
    for (let j in externals) {
      if (i.n === j) {
        log(` ${j} has been replaced to ${externals[j]}`);
        replacement.push([i, externals[j]]);
        break;
      }
    }
  }
  let start = 0,
    end: any = replacement[0]?.[0]?.s || undefined;

  replacement.forEach((k, i) => {
    newSource += source.substring(start, end) + k[1];
    start = replacement[i][0].e;
    end = replacement[i + 1]?.[0]?.s || undefined;
  });
  newSource += source.substring(start, end);
  return newSource;
}

export function addSplitCss(
  source: string,
  config: homeConfig,
  remoteList: remoteListType
) {
  const [imports] = parse(source, "optional-sourcename");
  let addonCss = ``;

  for (let i of imports as any) {
    if (!i.n) continue;
    let ret = i.n.match(/^\!(.*)\/(.*)$/);
    if (ret && ret[1] && ret[2]) {
      let projectName = ret[1];
      let moduleName = ret[2];
      for (let i of remoteList[projectName]) {
        if (i.name === moduleName) {
          moduleName = i.url.replace("./", "");
          break;
        }
      }
      if (
        (config.cssSplit as string[]).includes(projectName) &&
        normalizeFileName(moduleName).endsWith("js")
      ) {
        addonCss += `import "!${projectName}/${path.basename(
          moduleName,
          ".js"
        )}.css";`;
      }
    }
  }
  return addonCss + source;
}

export function getModuleName(fileName: string) {
  return fileName.replace(path.extname(fileName), "");
}

export async function sendHMRInfo({
  url,
  project,
  file,
  module,
}: {
  url: string;
  project: string;
  file: string;
  module: string[];
}) {
  return await axios.get(
    `${url}?file=${file}&project=${project}&module=${JSON.stringify(module)}`
  );
}

export function resolveURLQuery(url: string) {
  if (!url.startsWith(`/${VIRTUAL_HMR_PREFIX}`)) return false;
  let queryUrl = url.replace(`/${VIRTUAL_HMR_PREFIX}`, "");
  let query = new URLSearchParams(queryUrl);

  return {
    file: query.get("file"),
    project: query.get("project"),
    module: JSON.parse(query.get("module") as string) as string[],
  };
}

export async function analyseTSEntry(code: string) {
  let [imports, exports] = await parse(code);
  let modulePathMap: ModulePathMap = {};
  exports.forEach((item, i) => {
    modulePathMap[item] = imports[i].n as string;
  });
  return modulePathMap;
}

export function updateTSconfig(project: string, modulePathMap: ModulePathMap) {
  let tsconfigPath = path.join(process.cwd(), "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    let tsconfig = readJsonSync(tsconfigPath);
    JSON.parse(fs.readFileSync(tsconfigPath).toString());
    if (!tsconfig.compilerOptions.paths) {
      tsconfig.compilerOptions.paths = {};
    }
    for (let i in modulePathMap) {
      tsconfig.compilerOptions.paths[`!${project}/${i}`] = [
        "./" +
          path
            .join(
              `node_modules/vite-federation/types/${project}`,
              modulePathMap[i]
            )
            .replace(/\\/g, "/"),
      ];
    }
    outputJSONSync(tsconfigPath, tsconfig);
  }
}

export async function updateTypesFile(
  baseUrl: string,
  project: string,
  filePath: string
) {
  try {
    let { data } = await axios.get(URL.resolve(baseUrl, filePath));
    let p = path.resolve(TYPES_CACHE, project, filePath);
    outputFileSync(p, data);
    log(`update types file --${p}`, "blue");
  } catch (e) {}
}
export async function downloadTSFiles(url: string, project: string) {
  let { data } = await axios.get(url);
  let fileSet = data;
  let entryFileCode;
  for (let i of fileSet) {
    if (i.endsWith(".ts")) {
      let { data: code } = await axios.get(URL.resolve(url, i));
      if (i === "micro.d.ts") {
        entryFileCode = code.replace(/^export declare/gm, "export");
      }

      outputFileSync(path.resolve(TYPES_CACHE, project, i), code);
    }
  }
  return entryFileCode;
}

let fileSet: string[] = [];
let rootDir: string;
export function traverseDic(dirPath: string, cb?: (opt: string[]) => void) {
  if (!rootDir) rootDir = dirPath;
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach(function (file) {
    var filePath = path.join(dirPath, file.name);
    if (file.isFile()) {
      fileSet.push(path.relative(rootDir, filePath).replace("\\", "/"));
    } else if (file.isDirectory()) {
      traverseDic(filePath);
    }
  });
  cb?.(fileSet);
}

export function log(msg: string, color: keyof Color = "green") {
  console.log(colors[color](`${colors.cyan(`[vite:federation]`)} ${msg}`));
}
