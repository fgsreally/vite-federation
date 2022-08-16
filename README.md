# vite-federation

A module federation scheme based on VITE implementation, inspired by Webpack5 federation. Supports ESM format only.

###### Features

- 💚 Dock module can statically compile/dynamically import remote modules (depending on requirements)
- ✨ has no impact on the original project converted to remote modules (either development or production environment)
- ⚡️ Fewer requests than Webpack module federation (for both development and production environments)
- 🏝 free call remote module (even if they don't transform base module, can without intrusion used in tools such as low code)
- 🪐 can handle split CSS correctly
- 🦾 can use cache or hot update
- 🌈 can be used in a variety of micro front-end/multi-module solutions
- 😃 Easy access to service registry, fit for engineering scheme

<br>
P.S. I only tested the VUE project
Webpack Module federation is currently not compatible ，If you insist on using it,<a href="https://github.com/originjs/vite-plugin-federation">vite-plugin-federation</a> may be helpful
<br>

## Installation

```bash
npm i vite/federation -D
```

## basic concept

There are two roles, the remote module and the base module. The remote module can be a product project, or it can be a simple library , and the base module receives the modules and uses them.

Note: Due to the features of the Vite development phase, remote modules cannot provide modules to the base in the development environment. They must be packaged later. If you need to change the effect immediately, please use the Watch mode to package

## basic

Overall process: 1 Add micro.js remote.config.ts/js to the remote module
2 Package with remote.config.ts/js
3 Pairs of packaged folders (Remote by default) that are placed on the server and allowed to cross domains
Add the plugin to the base project and use it normally

In the remote module, the following two files need to be added

```ts
//in micro.js(you can change it)
let App = import("./src/App.vue");
// The name must be the same as the file name
export { App };
```

```ts
//in remote.config.ts(if you use it in vite.config.ts,it will effect origin project bundling )
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { remotePlugin } from "vite-federation";

export default defineConfig({
  plugins: [
    vue(),
    remotePlugin({
      externals: {
        //Shared packages. If you want a VUE project, you must have a VUE in it. If you want to test only locally, you can use a UUID
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js", //cdn url
      },
    }),
  ],
});
```

in base module

```ts
//in vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { homePlugin } from "vite-federation";
export default defineConfig({
  plugins: [
    vue(),
    homePlugin({
      externals: {
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",//be the same with remoteModule
      },
      remote: {
        app: "http://127.0.0.1:8080",
      },
      cache:true//Set this parameter to false if you want to synchronize the remote module observations
      mode: "hot",//If it is "hot", then the production environment will pack the same effect as the module federation, otherwise("cold") it will be the same as a normal project
      importMap:true,
      cssSplit: [],
    }),
  ],
});

```

If the remote project's CSS is split:

```ts
//in any .vue/jsx/tsx/ts/js files
import test1 from "@app/App";
import "@app/App.css";
```

By adding "app" to cssSplit, the CSS problem can be ignored, like this:

```ts
//in any .vue/jsx/tsx/ts/js files
import test1 from "@app/App";
```

If you are using the CSS as a whole, you need to import it manually at the entry point
Like this:

```ts
import "@app/style.css";
```

## dynamic import

(not good)
If you don't want to make any changes to the base module and just want to use the dynamically introduced effects, you can add them directly to the existing project manually (CSS also needs to be added manually)
(If and only if production environment works)

```ts
const test = import(/* @vite-ignore */ "http//localhost:8000/App.js");
```

## HMR

If you want to debug both the remote module and the base module, you need to change the HMR config in the remote module, as shown in Example

## importMap

Since it is inherently ESM dependent, it is necessary to ensure that the same dependencies must come from the same source in all parts of the project. If a part of the project, such as the component library, is already packaged on the CDN, and the VUE in the component library does not specify a point, this can be a problem in hot mode packaging.importmap can solve it.

If you feel that ImportMap is not compatible, consider this repository <a href="https://github.com/guybedford/es-module-shims">es-module-shims</a>


## next plan 
1 add snap test
2 make a dynamic import playground