import { get } from "lodash-es";
import { share } from "./share";
let obj = { a: 1 };
/**
 * Code blocks are great for examples
 *
 * ```ts
 * // run typedoc --help for a list of supported languages
 * const instance = new MyClass();
 * ```
 */
export function test() {
  console.log("remote-test");
  console.log(get(obj, "a"));
  share()
}
