import URL from 'url';
import axios from 'axios';
import { createFilter } from "vite";
import { init, parse } from "es-module-lexer";
import MagicString from "magic-string";
import { devConfig } from "./types"

export function devPlugin(
    config: devConfig
): any {
    let { include = /\.[ts|js|vue]/, exclude } = config.opts || {};
    const filter = createFilter(include, exclude);

    return {
        name: "vite-plugin-viewEngine",
        enforce: "post",
        async config(cf: any) {
            if (config.remote) {

                let alias: any = cf.resolve?.alias || []
                if (!Array.isArray(alias)) {
                    alias = Object.entries(alias).map((item) => {
                        return { find: item[0], replacement: item[1] }
                    })
                }
                for (let i in config.remote) {
                    let { data: source } = await axios.get(config.remote[i])
                    source.replace(
                        /\s([^\s]*)\s=\simport\("(.*)"\)/g,
                        (_: string, name: string, url: string) => {
                            alias.push({ find: `!${i}/${name}`, replacement: URL.resolve((config.remote as any)[i], url) })
                            console.log({ find: `!${i}/${name}`, replacement: URL.resolve((config.remote as any)[i], url) })
                            return "";
                        }
                    )
                }


                if (!cf.resolve) cf.resolve = {}
                cf.resolve.alias = alias
            }



        },

        async options() {
            await init;

        },
        transform(code: string, id: string) {
            if (!id.includes("node_modules") && filter(id)) {
                let newSource = new MagicString(code);

                const [imports] = parse(code, "optional-sourcename");
                for (let i of imports as any) {
                    for (let j in config.externals) {
                        if (i.n === j) {
                            newSource.overwrite(i.s, i.e, config.externals[j]);
                            break;
                        }
                    }
                }

                return newSource.toString();
            }
        },
        transformIndexHtml(html: string) {
            return html.replace(
                /<title>(.*?)<\/title>/,
                (_: string, js: string) => {
                    return (
                        _ +
                        `\n<script type="importmap">
                  {
                    "imports":${JSON.stringify(config.externals)}
                  }
                  </script>`
                    );
                }
            );
        }
    };
}
