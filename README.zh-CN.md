# vite-federation

**中文** | [English](./README.md)

一种基于 vite 实现的模块联邦方案，灵感来源自 webpack5 federation。仅支持 esm 格式，

###### Features

- 💚 基座模块可以静态编译/动态导入远程模块(取决于需求)
- ✨ 对改造为远程模块的原项目无任何影响(无论是开发还是生产环境)
- ⚡️ 比 webpack 模块联邦更少的请求次数(无论是开发还是生产环境)
- 🏝  可自由调用远程模块(即使不改造为基座模块，可以无侵入地在诸如低代码工具中使用)
- 🪐 可以正确处理分割 css,提供类型支持
- 🦾 可使用缓存，也可热更新
- 🌈 可以在微前端/多模块多种方案中使用
- 😃 容易接入服务注册中心，契合工程化方案

<br>

附：我仅仅测试了 vue 项目
目前不兼容 webpack 的模块联邦，如果想兼容，可以使用<a href="https://github.com/originjs/vite-plugin-federation">vite-plugin-federation</a>
<br>

## Installation

```bash
npm i vite/federation -D
```

## basic concept

存在两种角色，远程模块和基座模块，远程模块可以是一个现成的项目，也可以是单纯的库，负责打包出来需要的模块，基座模块接收模块并使用。

提醒：因为 vite 开发阶段的特性，远程模块不能在开发环境中提供模块给基座，必须打包了以后才行，如果你需要即时更改的效果，请使用 watch 模式打包

## basic

整体流程：1 在远程模块中增加 micro.js remote.config.ts/js
2 用 remote.config.ts/js 进行打包
3 对打包出的文件夹(默认在 remote)，将其放在服务器上并允许跨域
4 在基座项目中增加插件并正常使用

远程模块中，需要增加如下两个文件

```ts
//in micro.js(you can change it)
let App = import("./src/App.vue");
// 名称需要和文件名相同
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
        //共有包，如果是vue项目这里面必须要有vue，如果仅想本地测试，换成一个uuid也未尝不可
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js", //cdn url
      },
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
        vue: "https://cdn.bootcdn.net/ajax/libs/vue/3.2.33/vue.esm-browser.js",//和远程模块中一定要一样
      },
      remote: {
        app: "http://127.0.0.1:8080",
      },
      cache:false//如果需要同步更改远程模块观察效果，需要置为false
      mode: "hot",//如果是hot，那么生产环境中就会打包出和模块联邦近似的效果，反之则和普通项目无区别
      importMap:true,
      cssSplit: [],
    }),
  ],
});

```

如果远程项目的 css 是分割的，要么这么引用：

```ts
//in any .vue/jsx/tsx/ts/js files
import test1 from "@app/App";
import "@app/App.css";
```

要么在 cssSplit 中添加 app，就可以忽略 css 问题，像这样：

```ts
//in any .vue/jsx/tsx/ts/js files
import test1 from "@app/App";
```
如果对象并不是组件而是一个纯js模块，会显示找不到模块，但这不会破坏什么

如果使用的是整体的 css，需要在入口手动引入
像这样

```ts
import "@app/style.css";
```

## 一种不太好的使用

如果不想对基座模块做任何更改，并且只想使用动态引入的效果，可以直接在现成项目中手动添加 (css 同样需要手动增加)
(当且仅当生产环境起效)

```ts
const test = import(/* @vite-ignore */ "http//localhost:8000/App.js");
```

## HMR

如果希望同时调试远程模块和基座模块，需要更改远程模块中的 HMR，这个详见 example

## importMap

因为本质是依赖 esm 的，所以必须保证所有的部分里面，相同的依赖必须来自同一个源，如果项目中一个部分，比如组件库，已经打包好放到 cdn 上了，而组件库中的 vue 并没有规定指向，这在热模式打包中会出问题，importmap 可以解决
如果觉得 importmap 兼容性不好，可以考虑这个方案<a href="https://github.com/guybedford/es-module-shims">es-module-shims</a>

## typescript

其实应该内置生成 types 的功能，但我暂时没这么做，想生成 types 的话，需要依赖其他插件，但由于插件之间难以传递信息，这种模式可能会有部分问题（比如热更新时机，以及在 watch 模式下，文件覆盖冲突等）
将类型文件单独放到 remote 文件夹下的 types 中（以此为标准），目前实现的效果是在启动服务的时候，下载 types 下的所有文件,重写tsconfig.json（这可能会带来很大的性能问题，在第二次启动时可以考虑关掉types），通过延时的操作提供了一点热更新的能力。总而言之，不建议使用

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
