import axios from "axios";
import path, { join, resolve } from "path";
import URL from "url";
import { ImportSpecifier, parse } from "es-module-lexer";
import { homeConfig, externals, ModulePathMap } from "./types";
import colors, { Color } from "colors";
import fs from "fs";
import { outputFileSync, outputJSONSync, readJSONSync } from "fs-extra";
import MagicString from "magic-string";
import { minVersion } from "semver"

export const FEDERATION_RE = /\!(.*)\/([^?]*)/;
export const VIRTUAL_PREFIX = "/@virtual:vite-federation/";
export const VIRTUAL_EMPTY = "/@virtual:EmptyModule";
export const VIRTUAL_HMR_PREFIX = "VIRTUAL-HMR";
export const ESM_SH_URL = "https://esm.sh/"
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

export function replaceImportDeclarations(source: any, externals: externals) {
  // let newSource = source;
  let newSource = new MagicString(source);

  const [imports] = parse(source, "optional-sourcename");
  for (let i of imports as any) {
    // if (/^\.\//.test(i.n)) {
    //   newSource = newSource.replace(
    //     i.n,
    //     `!${project}/${getFileName(i.n).replace(/\.js$/, "")}`
    //   );
    // }
    for (let j in externals) {
      if (i.n === externals[j]) {
        // newSource = newSource.replace(i.n, j);
        newSource.overwrite(i.s, i.e, j);

        break;
      }
    }
  }

  return newSource.toString();
}

export function ImportExpression(source: string) {
  let ret: { url: string; name: string }[] = [];
  source.replace(
    /\s([^\s]*)\s=\simport\("(.*)"\)/g,
    (_: string, name: string, i: string) => {
      ret.push({ url: i, name: name });
      return "";
    }
  );


  return ret;
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
  // let newSource = source;
  let newSource = new MagicString(source);
  let cssImports = "";
  for (let i of imports as any) {
    if (FEDERATION_RE.test(i.n)) {
      let ret = i.n.match(FEDERATION_RE);

      let fileName = normalizeFileName(ret[2]);
      if (path.extname(fileName) === ".js") {
        newSource.overwrite(i.s, i.e, config.remote[ret[1]] + `/${fileName}`);
      }
      if (path.extname(fileName) === ".css") {
        cssImports += `\nloadCss("${config.remote[ret[1]]}/${fileName}");`;
        newSource.overwrite(i.ss, i.se, "");
      }
      //if (path.extname(fileName) === ".js")
      // newSource = newSource.replace(
      //   i.n,
      //   config.remote[ret[1]] + `/${fileName}`
      // );
      // if (path.extname(fileName) === ".css") {
      //   cssImports = `loadCss("${config.remote[ret[1]]}/${fileName}")`;
      //   newSource = newSource.replace(newSource.substring(i.ss, i.se), "");
      // }
    }
  }
  if (cssImports.length > 0) {
    newSource
      .prepend(`import {loadCss} from "vite-federation/helper"`)
      .append(cssImports);
    // newSource =
    //   newSource +
    //   `export function loadCss(url){
    //   let css = document.createElement('link');
    //   css.href = url;
    //   css.rel = 'stylesheet';
    //   css.type = 'text/css';
    //   document.head.appendChild(css);
    // };` +
    //   cssImports;
  }
  return newSource.toString();
}

export function replaceBundleImportDeclarations(
  source: string,
  externals: externals
) {
  const [imports] = parse(source, "optional-sourcename");
  // let newSource = ``;
  let newSource = new MagicString(source);

  let replacement: [ImportSpecifier, string][] = [];

  for (let i of imports) {
    for (let j in externals) {
      if (i.n === j) {
        log(` ${j} has been replaced to ${externals[j]}`);
        replacement.push([i, externals[j]]);
        newSource.overwrite(i.s, i.e, externals[j]);
        break;
      }
    }
  }
  // let start = 0,
  //   end: any = replacement[0]?.[0]?.s || undefined;

  // replacement.forEach((k, i) => {
  //   newSource += source.substring(start, end) + k[1];
  //   start = replacement[i][0].e;
  //   end = replacement[i + 1]?.[0]?.s || undefined;
  // });
  // newSource += source.substring(start, end);
  return newSource.toString();
}

export function vueExtension(source: string) {
  let newSource = new MagicString(source);

  const [imports] = parse(source, "optional-sourcename");
  let addonCss = ``;

  for (let i of imports as any) {
    if (!i.n) continue;
    if (FEDERATION_RE.test(i.n)) {
      let ret = i.n.match(FEDERATION_RE);
      if (ret[2].endsWith(".vue")) {
        newSource.overwrite(i.s, i.e, `${i.n.slice(0, -4)}`);
        addonCss += `import "${i.n.replace(/\.vue$/, "")}.css"\n`;
      }
    }
  }
  return addonCss + newSource.toString();
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
  let tsconfig: any = { compilerOptions: { paths: {} } };

  for (let i in modulePathMap) {
    let jsPath =
      "./" + join(`./types/${project}`, modulePathMap[i]).replace(/\\/g, "/");
    if (modulePathMap[i].endsWith(".vue")) {
      tsconfig.compilerOptions.paths[`!${project}/${i}{,.vue}`] = [jsPath];
    } else {
      tsconfig.compilerOptions.paths[`!${project}/${i}`] = [jsPath];

    }
  }
  outputJSONSync(resolve(__dirname, "../tsconfig.federation.json"), tsconfig);
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
  } catch (e) { }
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

export function replaceEntryFile(code: string, source: string) {//work for vite^3

  const [i1] = parse(source, "optional-sourcename");
  const [i2] = parse(code, "optional-sourcename");
  let newSource = new MagicString(source);
  i1.forEach((item, i) => {
    newSource.overwrite(item.s, item.e, `"${i2[i].n}"`)
  })
  return newSource.toString();
}

export function auto(imports?: string[]) {//work for esm.sh
  const { dependencies } = readJSONSync(resolve(process.cwd(), "package.json"))
  let externals: externals = {}
  for (let i in dependencies) {
    if (!imports || imports.includes(i))
      externals[i] = `${ESM_SH_URL}${i}@${minVersion(dependencies[i])}`
  }
  return externals
}