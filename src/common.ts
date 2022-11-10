import { resolve } from "path";

export const FEDERATION_RE = /\!(.*)\/([^?]*)/;
export const VIRTUAL_PREFIX = "/@virtual:vite-federation/";
export const VIRTUAL_EMPTY = "/@virtual:EmptyModule";
export const VIRTUAL_HMR_PREFIX = "VIRTUAL-HMR";
export const ESM_SH_URL = "https://esm.sh/";
export const TS_CONFIG_PATH = resolve(
  process.cwd(),
  "tsconfig.federation.json"
);

export const HMT_TYPES_TIMEOUT = 5000;
