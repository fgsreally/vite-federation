import { UNPKG_URL, ESM_SH_URL } from "./common";

export function unpkg(imports: string[]) {
  //work for unpkg
  let externals: { [key: string]: string } = {};

  for (let i of imports) {
    externals[i] = `${UNPKG_URL}${i}?module`;
  }
  return externals;
}

export function esmsh(imports: string[]) {
  //work for unpkg
  let externals: { [key: string]: string } = {};

  for (let i of imports) {
    externals[i] = `${ESM_SH_URL}${i}`;
  }
  return externals;
}
