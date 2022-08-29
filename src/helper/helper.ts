import { setupDevtoolsPlugin, App } from "@vue/devtools-api";

let localMap: { [key in string]: boolean } = {};

export function vueDev() {
  return {
    install(app: App) {
      if (process.env.NODE_ENV === "development") {
        setupDevtoolsPlugin(
          {
            id: "vite-federation",
            label: "vite-federation",
            packageName: "vite-federation",
            componentStateTypes: ["vite-federation"],
            app,
          },
          (api: any) => {
            api.on.visitComponentTree(
              ({ componentInstance, treeNode: node }: any) => {
                localMap[node.uid] = componentInstance.type.__file
                  ? true
                  : false;
                if (!localMap[node.uid]) {
                  node.tags.push({
                    label: "Remote",
                    textColor: 0xFF2525,
                    backgroundColor: 0xfbab7e,
                    tooltip: `remote component from federation`,
                  });
                }
                if (node.uid === 0) {
                  traverse(node);
                }
              }
            );
          }
        );
      }
    },
  };
}
function traverse(node: any, isRemote: boolean = false) {
  node.children.forEach((item: any) => {
    if (isRemote) {
      if (!localMap[item.uid]) {
        item.tags.forEach((tag: any) => {
          if (tag.label === "Remote") {
            tag.label = "Remote Root";
            tag.tooltip = "remote component from federation(root)";
          }
        });
      }
    }
    traverse(item, isRemote ? isRemote : localMap[item.uid]);
  });
}
