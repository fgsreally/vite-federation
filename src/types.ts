export interface externals {
  [key: string]: string;
}
interface remoteVueconfig {
  delScoped?: boolean;
  addTag?: boolean
}
export interface remoteConfig {
  outDir?: string;
  entry?: string;
  externals: externals;
  version?: number;
  importMap: boolean;
  project?: string;
  // vendor?: string[];
  HMR?: {
    projectName: string;
    homePort: string;
  };
  cssSplit?: boolean;
  vue?: remoteVueconfig;
  meta?: Metadata | any;
}

type Metadata = {
  version?: string;
  author?: string;
};

interface homeVueconfig {
  resolve: boolean;
}
export interface homeConfig {
  externals?: externals;
  version?: number;
  remote: externals;
  mode: "hot" | "cold";
  cache: boolean;
  importMap: boolean;
  types?: boolean;
  info?: boolean;
  vue?: homeVueconfig;
}

export type remoteListType = {
  [key in string]: {
    name: string;
    url: string;
  }[];
};

export type ModulePathMap = { [key in string]: string };

interface Options {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}

export type devConfig = {
  externals: { [key in string]: string },
  remote?: { [key in string]: string },
  opts?: Options
}