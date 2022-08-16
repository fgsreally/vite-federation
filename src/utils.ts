import path from "path";
import { ImportSpecifier, parse } from "es-module-lexer";
import { homeConfig, externals } from "./types";
import colors from "colors";

export const VIRTUAL_PREFIX = "/@virtual:vite-federation/";
export const VIRTUAL_EMPTY = "/@virtual:EmptyModule";

export const VIRTUAL_HMR_PREFIX = "VIRTUAL-HMR";

export function HMRHandler(url: String) {
  if (!url.startsWith(`/${VIRTUAL_HMR_PREFIX}`)) return false;

  let virtualFile: string[] = url.slice(url.lastIndexOf("/") + 1).split("&");

  let ret = [];
  for (let i = 1; i < virtualFile.length; i++) {
    ret.push(`${virtualFile[0]}/${virtualFile[i]}`);
  }
  return ret;
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
  if (/^\.\//.test(url)) {
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

export function ImportExpression(source: any) {
  const [imports] = parse(source, "optional-sourcename");
  return imports.map((i: { n: any }) => {
    return i.n;
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
        console.log(
          colors.green(`\n${j} has been replaced to ${externals[j]}`)
        );
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

export function addSplitCss(source: string, config: homeConfig) {
  const [imports] = parse(source, "optional-sourcename");
  let addonCss = ``;

  for (let i of imports as any) {
    if (!i.n) continue;
    let ret = i.n.match(/^\!(.*)\/(.*)$/);
    if (ret && ret[1] && ret[2]) {
      if (
        (config.cssSplit as string[]).includes(ret[1]) &&
        normalizeFileName(ret[2]).endsWith("js")
      ) {
        addonCss += `import "!${ret[1]}/${path.basename(ret[2], ".js")}.css";`;
      }
    }
  }
  return addonCss + source;
}

export function getModuleName(fileName: string) {
  return fileName.replace(path.extname(fileName), "");
}
