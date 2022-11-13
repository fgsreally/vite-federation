import { ModuleNode, normalizePath } from "vite";
import axios from "axios";
import { extname, join, relative, resolve } from "path";
import URL from "url";
import { ImportSpecifier, parse } from "es-module-lexer";
import {
  homeConfig,
  externals,
  ModulePathMap,
  remoteListType,
  extensionType,
} from "./types";
import colors, { Color } from "colors";
import fs from "fs";
import {
  outputFileSync,
  outputJSONSync,
  readJSONSync,
  existsSync,
  outputFile,
} from "fs-extra";
import MagicString from "magic-string";
import { minVersion } from "semver";
import {
  FEDERATION_RE,
  VIRTUAL_HMR_PREFIX,
  ESM_SH_URL,
  VIRTUAL_PREFIX,
  TS_CONFIG_PATH,
  HMT_TYPES_TIMEOUT,
} from "./common";

export const TYPES_CACHE = resolve(process.cwd(), ".federation-type");

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

export function normalizeFileName(name: string) {
  return `${name}${extname(name) ? "" : ".js"}`;
}

export function replaceImportDeclarations(source: any, externals: externals) {
  // let newSource = source;
  let newSource = new MagicString(source);

  const [imports] = parse(source, "optional-sourcename");
  for (let i of imports as any) {
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
    /\s([^\s]*)\s=\simport\("\.\/(.*)\.js"\)/g,
    (_: string, name: string, i: string) => {
      ret.push({ url: i, name: name });
      return "";
    }
  );

  return ret;
}

export function replaceHotImportDeclarations(
  source: any,
  config: homeConfig,
  aliasMap: remoteListType
) {
  const [imports] = parse(source, "optional-sourcename");
  // let newSource = source;
  let newSource = new MagicString(source);
  let cssImports = "";
  for (let i of imports as any) {
    if (FEDERATION_RE.test(i.n)) {
      let [project, moduleName, basename] = resolveModuleAlias(i.n, aliasMap);

      if (extname(moduleName) === ".js") {
        newSource.overwrite(
          i.s,
          i.e,
          URL.resolve(config.remote[project], moduleName)
        );
      }
      if (extname(moduleName) === ".v") {
        newSource.overwrite(
          i.s,
          i.e,
          URL.resolve(config.remote[project], basename + ".js")
        );
        cssImports += `\nloadCss("${config.remote[project]}/${basename}.css");`;
      }

      if (extname(moduleName) === ".css") {
        cssImports += `\nloadCss("${config.remote[project]}/${moduleName}");`;
        newSource.overwrite(i.ss, i.se, "");
      }
    }
  }
  if (cssImports.length > 0) {
    newSource
      .prepend(`import {loadCss} from "vite-federation/helper"\n`)
      .append(cssImports);
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



export function getModuleName(fileName: string) {
  return fileName.replace(extname(fileName), "");
}

export function getHMRFilePath(i: ModuleNode) {
  return "/" + normalizePath(relative(process.cwd(), i?.file || ""));
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
    let jsPath = normalizePath(
      "./" + join(`./.federation-type/${project}`, modulePathMap[i])
    );
    tsconfig.compilerOptions.paths[`!${project}/${i}.*`] = [jsPath];
    tsconfig.compilerOptions.paths[`!${project}/${i}`] = [jsPath];
    // if (modulePathMap[i].endsWith(".vue")) {

    // } else {
    //   tsconfig.compilerOptions.paths[`!${project}/${i}`] = [jsPath];
    // }
  }
  outputJSONSync(TS_CONFIG_PATH, tsconfig);
}

export async function updateTypesFile(
  baseUrl: string,
  project: string,
  filePath: string
) {
  try {
    let { data } = await axios.get(URL.resolve(baseUrl, filePath));
    let p = resolve(TYPES_CACHE, project, filePath);
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

      outputFileSync(resolve(TYPES_CACHE, project, i), code);
    }
  }
  return entryFileCode;
}

let fileSet: string[] = [];
let rootDir: string;
export function traverseDic(dirPath: string, cb?: (opt: string[]) => void) {
  if (!rootDir) rootDir = dirPath;
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach(function (file) {
    var filePath = join(dirPath, file.name);
    if (file.isFile()) {
      fileSet.push(normalizePath(relative(rootDir, filePath)));
    } else if (file.isDirectory()) {
      traverseDic(filePath);
    }
  });
  cb?.(fileSet);
}

export function log(msg: string, color: keyof Color = "green") {
  console.log(colors[color](`\n${colors.cyan(`[vite:federation]`)} ${msg}`));
}

export function replaceEntryFile(code: string, source: string) {
  //work for vite^3

  const [i1] = parse(source, "optional-sourcename");
  const [i2] = parse(code, "optional-sourcename");
  let newSource = new MagicString(source);

  i1.forEach((item, i) => {
    newSource.overwrite(item.s, item.e, `"${i2[i].n}"`);
  });
  return newSource.toString();
}

export function auto(imports?: string[]) {
  //work for esm.sh
  const { dependencies } = readJSONSync(resolve(process.cwd(), "package.json"));
  let externals: externals = {};
  for (let i in dependencies) {
    if (!imports || imports.includes(i))
      externals[i] = `${ESM_SH_URL}${i}@${minVersion(dependencies[i])}`;
  }
  return externals;
}

export function resolvePathToModule(id: string) {
  if (id.includes(VIRTUAL_PREFIX)) id = id.split(VIRTUAL_PREFIX)[1];
  if (FEDERATION_RE.test(id)) return id;
  return "";
}

export function resolveModuleAlias(id: string, alias: remoteListType) {
  let [_, project, moduleName] = id.match(FEDERATION_RE) as string[];

  let baseName = moduleName.split(".")[0];
  for (let i of alias[project]) {
    if (i.name === baseName) {
      baseName = i.url;
    }
  }

  return [project, baseName + (extname(moduleName) || ".js"), baseName];
}

export async function getVirtualContent(
  url: string,
  project: string,
  moduleName: string,
  allowCache?: boolean
) {
  let path = resolve(process.cwd(), ".federation-cache", project, moduleName);

  if (allowCache) {
    if (existsSync(path)) {
      return fs.readFileSync(path, "utf-8");
    }
  }

  let { data } = await axios.get(url);
  let content = typeof data === "string" ? data : JSON.stringify(data);
  if (allowCache) {
    outputFile(path, content, "utf-8");
  }
  return content;
}

export function resolveExtension(
  extensions: extensionType[],
  moduleName: string,
  basename: string
) {
  for (let i of extensions) {
    if (extname(moduleName) === i.key) {
      return i.transform(basename);
    }
  }
}
