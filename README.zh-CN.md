# vite-federation

v0.0.6

**中文** | [English](./README.md)

一种基于 vite 实现的模块联邦方案，灵感来源自 webpack5 federation。仅支持 esm 格式，

###### Features

- 💚 基座模块可以静态编译/动态导入远程模块(取决于需求)
- ✨ 对改造为远程模块的原项目无任何影响(无论是开发还是生产环境)
- ⚡️ 比 webpack 模块联邦更少的请求次数(无论是开发还是生产环境)
- 🏝 可自由调用远程模块(即使不改造为基座模块，可以无侵入地在诸如低代码工具中使用)
- 🪐 可以正确处理分割 css
- 🦾 支持热更新和类型提示，完美的开发体验
- 🌈 可以在微前端/多模块多种方案中使用
- 😃 支持 vue，但也不止于 vue

<br>

思路并不相同不兼容 webpack 的模块联邦，如果想兼容，可以使用<a href="https://github.com/originjs/vite-plugin-federation">vite-plugin-federation</a>
<br>

## Installation

```bash
npm i vite/federation -D
```

## basic concept

存在两种角色，远程模块和基座模块，远程模块可以是一个现成的项目，也可以是单纯的库，负责打包出来需要的模块，基座模块接收模块并使用。

提醒：因为 vite 开发阶段的特性，远程模块不能在开发环境中提供模块给基座，必须打包了以后才行，如果你需要即时更改的效果，请使用 watch 模式打包

## basic

整体流程：1 在远程模块中增加 micro.js(入口，也可以自定义) remote.config.ts/js（配置文件，直接在 vite.config 里面改也可以，但可能会对原项目产生某种影响。）
2 用 remote.config.ts/js 进行打包
3 对打包出的文件夹(默认在 remote)，将其放在服务器上并允许跨域
4 在基座项目中增加插件并正常使用

远程模块中，需要增加如下两个文件

```ts
//in micro.js(you can change it)
let app = import("./src/App.vue");
export { app };
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
      entry: "src/micro.ts", //ts的话
      externals: {
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js", //项目公有依赖放在cdn，防止重复加载（而且vue本身必须用cdn）
      },
      HMR: {
        //本地调试时热更新的配置，
        projectName: "app", //该模块在基座中的名称
        homePort: "http://localhost:3000", //模块在的链接
      },
      cssSplit: true,
      importMap: true, //这个配置，基座和远程模块中必须一样
    }),
  ],
});
```

在基座模块中

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
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",//和远程模块中一定要一样，不写的话，会自动去加载远程中的external
      },
      remote: {//远程的项目及网址
        app: "http://127.0.0.1:8080",
      },
      cache:false//如果true，会稍微提前加载一点，意义不大
      mode: "hot",//如果是hot，那么生产环境中就会打包出和模块联邦近似的效果，反之则和普通项目无区别
      importMap:true,
      info:false,//如果true，会提示更多信息
    }),
  ],
});

```

基座中使用时

```ts
import test1 from "@app/app"; //这会引入 App.js，这个取决于在micro.js中怎么映射的
import test1 from "@app/App.js"; //这会引入App.js
import "@app/App.css"; //这会引入静态文件App.css
```

(就是说，别名引入的内容是跟 micro 中的导出相关，全名引入直接引入对应源的静态文件，)

如果要远程使用一个组件（而非一个简单的 js 模块，那么显然需要 css）
如果 css 是分割的，要么这么引用：

```ts
//in any .vue/jsx/tsx/ts/js files
import test1 from "@app/App";
import "@app/App.css";
```

或者

```ts
import test1 from "@app/App.vue";
```

它会将.vue 解析为一个 js 引入外加一个 css 引入

如果对应组件没有 css，会显示找不到模块，但这不会影响什么

如果使用的是整体的 css，需要在入口手动引入像这样

```ts
import "@app/style.css";
```

## 使用 example

```ts
yarn build
yarn build:remote//remote
http-server --cors//remote/remote
yarn dev //home

```

## 一种不太好的使用

如果不想对基座模块做任何更改，并且只想使用动态引入的效果，可以直接在现成项目中手动添加 (css 同样需要手动增加)
(当且仅当生产环境起效)

```ts
const test = import(/* @vite-ignore */ "http//localhost:8000/App.js");
```

## HMR

如果希望同时调试远程模块和基座模块，需要更改远程模块中的 HMR，这个详见 example
是真正的热更新，不是一个虚伪的 full reload

## importMap

因为本质是依赖 esm 的，所以必须保证所有的部分里面，相同的依赖必须来自同一个源，如果项目中一个部分，比如组件库，已经打包好放到 cdn 上了，而组件库中的 vue 并没有规定指向，这在热模式打包中会出问题，importmap 可以解决
如果觉得 importmap 兼容性不好，可以考虑这个方案<a href="https://github.com/guybedford/es-module-shims">es-module-shims</a>

## typescript

基座开发中提供类型支持：
（其实应该内置生成 types 的功能，但我暂时没这么做，想生成 types 的话，需要依赖其他插件，）
我使用了<a href="https://github.com/qmhc/vite-plugin-dts">vite-plugin-dts</a>，并以此生成的 types 作为规范,这个方案侵入性很强，如果要使用 ts，请严格按照 example 中案例使用，用其他生成 types 的方案可能会导致类型提示无效
目前我使用没有什么问题，但注意在用 watch 模式对远程模块打包时，在正在生成 dts 的过程中刷新，会影响 vite-plugin-dts，导致崩溃；当项目类型固定时，可以把 dts 取消

```ts
    dts({
      outputDir: "remote/types",
      compilerOptions: { removeComments: false },
      afterBuild: () => {
        traverseDic(resolve(process.cwd(), "remote/types"), (params) => {
          outputJSONSync(
            resolve(process.cwd(), "remote/types/types.json"),
            params
          );
        });
      },
    }),
    remotePlugin(...)

```

在 tsconfig.json 中

```json
  "extends": "./node_modules/vite-federation/tsconfig.federation.json",
```

```ts
homePlugin({
...
  types: true,//会去下载类型，第一次加载远程模块时打开，后续可以关上

});
```

## 文件结构

> 推荐结构

    |-- dist
    |-- remote(输出)
        ...
        |-- remoteEntry.js
        |-- remoteList.json(描述项目信息)
        |-- types
            |-- micro.d.ts(基座模块通过这个文件使得模块和类型能够一一对应)
            |-- types.json(描述类型文件信息)
            ...
    |-- src
        |-- micro.ts (入口)
        ...
    |-- README.md
    |-- remote.config.ts(federation 配置)
    |-- vite.config.ts (正常配置)
    |-- package.json
