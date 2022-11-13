export interface externals {
  [key: string]: string;
}
interface remoteVueconfig {
  delScoped?: boolean;
  addTag?: boolean;
}
export interface remoteConfig {
  outDir?: string;
  entry?: string;
  externals: externals;
  version?: number;
  importMap: boolean;
  project?: string;
  types?: boolean;
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

export interface homeConfig {
  externals?: externals;
  version?: number;
  remote: externals;
  mode: "hot" | "cold";
  cache?: boolean;
  importMap: boolean;
  types?: boolean;
  info?: boolean;
  prefetch?: boolean;
  extensions: extensionType[];
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
  externals: { [key in string]: string };
  remote?: { [key in string]: string };
  opts?: Options;
};

export type VisModuleGraph = {
  nodes: {
    key: string | number;
    attributes: {
      x: number;
      y: number;
      size: number;
      label: string;
      color: string;
    };
  }[];
  edges: {
    key: string | number;
    source: string | number;
    target: string | number;
    attributes: {
      color: string;
      size: number;
    };
  }[];
};

export type extensionType = {
  key: string;
  transform: (basename: string) => string;
};
