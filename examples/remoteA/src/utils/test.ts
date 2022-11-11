import { get } from "lodash-es";
let obj = { a: 1 };
/**
 * Code blocks are great for examples
 *
 * ```ts
 * // run typedoc --help for a list of supported languages
 * const instance = new MyClass();
 * ```
 */
export function test(name:string) {
  console.log(name);
  console.log(get(obj, "a"),1);

}
