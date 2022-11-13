import { extensionType } from "./types";

export let vExtension: extensionType = {
  key: ".v",
  transform: function (basename: string) {
    return `import Comp from "./${basename}.js"\n
     export default Comp
    import "./${basename}.css"
    `;
  },
};
