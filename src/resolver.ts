import type { ComponentResolver } from "unplugin-vue-components";

export function kebabCase(key: string) {
  const result = key.replace(/([A-Z])/g, " $1").trim();
  return result.split(" ").join("-").toLowerCase();
}

//from r-app-hello to !app/hello
export function FederationResolver() {
  function getSideEffects(id: string) {
    return `!${id.replace("-", "/")}.css`;
  }
  function resolveDirectory(id: string) {
    return `!${id.replace("-", "/")}`;
  }

  function componentsResolver(name: string) {
    if (name.match(/^r_[a-zA-Zd]+_[a-zA-Zd]+_[a-zA-Zd]+/)) {
        const [_,project, module, imports] = name.match(
          /^r_([a-zA-Zd]+)_([a-zA-Zd]+)_([a-zA-Zd]+)/
        ) as string[];
  
        return {
          name: imports,
          from: `!${project}/${module}`,
        };
      }
    if (name.match(/^R[A-Z]/)) {
      //FOR DEFAULT IMPORT
      const resolveId = kebabCase((name = name.slice(1)));

      return {
        sideEffects: getSideEffects(resolveId),
        from: resolveDirectory(resolveId),
      };
    }
   
    //from RAppHello to app-hello
  }

  const resolvers: ComponentResolver[] = [
    {
      type: "component",
      resolve: (name: string) => componentsResolver(name),
    },
  ];

  return resolvers;
}
