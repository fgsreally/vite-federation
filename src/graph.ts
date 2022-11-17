import { extname } from "path";
import { extensionType, VisModuleGraph } from "./types";
import { FEDERATION_RE } from "./common";

let getOffset = (() => {
  let i = 0;
  let offset = [0, 0];
  return () => {
    if (i++ % 2 == 0) {
      offset[0] = offset[0] + 1;
    } else {
      offset[1] = offset[1] + 1;
    }

    return offset;
  };
})();

let index = 0;

export class Graph {
  private moduleMap: { [key: string]: Set<string> } = {};
  private projectDep: { [key: string]: Set<string> } = {};
  constructor(public projects: string[], public extensions: extensionType[]) {
    projects.forEach((item) => {
      this.moduleMap[item] = new Set();
      this.projectDep[item] = new Set();
    });
  }

  getColor(ext: string) {
    if (ext === ".css") return "#cb62f8";
    return this.extensions.find((item) => item.key === ext)?.color || "#f82941";

  
  }
  addModule(id: string, importer: string) {
    let project = id.match(FEDERATION_RE)?.[1] as string;
    this.moduleMap[project].add(id);

    if (!this.moduleMap[id]) {
      this.moduleMap[id] = new Set();
    }
    if (importer) {
      this.moduleMap[importer].add(id);
    } else {
      this.projectDep[project].add(id);
    }
  }
  generate() {
    let ModuleGraph: VisModuleGraph = { nodes: [], edges: [] };
    this.projects.forEach((item) => {
      let offset = getOffset();
      ModuleGraph.nodes.push({
        key: item,
        attributes: {
          x: offset[0],
          size: 50,
          label: "project:" + item,
          color: "#9599E2",
          y: offset[1],
        },
      });

      [...this.moduleMap[item]].forEach((moduleID) => {
        ModuleGraph.nodes.push({
          key: moduleID,
          attributes: {
            x: offset[0] + Math.random(),
            size: 20,
            label: moduleID.match(FEDERATION_RE)?.[2] as string,
            color: this.getColor(extname(moduleID)),
            y: offset[1] + Math.random(),
          },
        });
        if (this.projectDep[item].has(moduleID))
          ModuleGraph.edges.push({
            key: index++,
            source: item,
            target: moduleID,
            attributes: {
              color: "#ff6b6b",
              size: 5,
            },
          });
        [...this.moduleMap[moduleID]].forEach((depID) => {
          ModuleGraph.edges.push({
            key: index++,
            source: moduleID,
            target: depID,
            attributes: {
              size: 1,
              color: "#fa510e",
            },
          });
        });
      });
    });
    return ModuleGraph;
  }
}
