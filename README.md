# vite-federation

A module federation scheme based on VITE implementation, inspired by Webpack5 federation. Supports ESM format only.

###### Features

- 💚 Dock module can statically compile/dynamically import remote modules (depending on requirements)
- ✨ has no impact on the original project converted to remote modules (either development or production environment)
- ⚡️ Fewer requests than Webpack module federation (for both development and production environments)
- 🏝 free call remote module (even if they don't transform base module, can without intrusion used in tools such as low code)
- 🪐 can handle split CSS correctly,provide type support
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

If the object is not a component but a pure JS module, it will show that the module is not found, but it won't break anything

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

## typescript

There should be a built-in ability to generate types, but I haven't done that yet. To generate types, you have to rely on other plugins, but this mode may have some problems (e.g. hot update timing, file overwriting conflicts in Watch mode, etc.) due to the difficulty of transferring information between plugins.

Separate the types files to the types folder in the remote folder (standard). The current implementation is to download all the files under remote/types at startup,rewrite tsconfig.json (this can be a big performance issue, consider turning them off at the second startup). Provides a little hot update capability through delayed operation.

For more detail, see Example

## structure

> recommend structure

    |-- dist
    |-- remote(output)
        ...
        |-- remoteEntry.js
        |-- remoteList.json(describe project info)
        |-- types
            |-- micro.d.ts(help "home" find module entry)
            |-- types.json(describe d.ts files )
            ...
    |-- src
        |-- micro.ts (core entry)
        ...
    |-- README.md
    |-- remote.config.ts(federation config)
    |-- vite.config.ts (normal config)
    |-- package.json
