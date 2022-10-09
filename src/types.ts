export interface externals {
  [key: string]: string;
}

export interface remoteConfig {
  outDir?: string;
  entry?: string;
  externals: externals;
  version?: number;
  importMap: boolean;
  // vendor?: string[];
  HMR?: {
    projectName: string;
    homePort: string;
  };
  cssSplit?: boolean;
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
  initFileList: string[];
  cache: boolean;
  importMap: boolean;
  types?: boolean;
  info?: boolean;
}

export type remoteListType = {
  [key in string]: {
    name: string;
    url: string;
  }[];
};

export type ModulePathMap = { [key in string]: string };
