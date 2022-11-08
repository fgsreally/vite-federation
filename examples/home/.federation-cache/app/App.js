import { defineComponent as d, openBlock as s, createElementBlock as c, Fragment as p, createVNode as t, unref as m, createElementVNode as v, toDisplayString as f } from "vue";
import { ElTree as u } from "element-plus";
import b from "./HelloWorld.js";
import "./share.js";
const o = (e) => {
  e.projectID = "federation-r", e.fileID = "App.vue";
}, h = /* @__PURE__ */ d({
  name: "App",
  props: {
    value: String
  },
  emits: ["firstClick"],
  setup(e, { emit: k }) {
    const i = e, n = {
      children: "children",
      label: "label"
    }, r = [
      {
        id: 1,
        label: "Level one 1",
        children: [
          {
            id: 4,
            label: "Level two 1-1",
            children: [
              {
                id: 9,
                label: "Level three 1-1-1"
              },
              {
                id: 10,
                label: "Level three 1-1-2"
              }
            ]
          }
        ]
      },
      {
        id: 2,
        label: "Level one 2",
        children: [
          {
            id: 5,
            label: "Level two 2-1"
          },
          {
            id: 6,
            label: "Level two 2-2"
          }
        ]
      },
      {
        id: 3,
        label: "Level one 3",
        children: [
          {
            id: 7,
            label: "Level two 3-1"
          },
          {
            id: 8,
            label: "Level two 3-2"
          }
        ]
      }
    ];
    return (a, l) => (s(), c(p, null, [
      t(m(u), {
        class: "testTree",
        data: r,
        "show-checkbox": "",
        "node-key": "id",
        "default-expanded-keys": [2, 4],
        "default-checked-keys": [5],
        props: n
      }),
      v("div", {
        onClick: l[0] || (l[0] = (L) => a.$emit("firstClick"))
      }, f(i.value), 1),
      t(b, { msg: "never test again!!" })
    ], 64));
  }
});
typeof o == "function" && o(h);
export {
  h as default
};
