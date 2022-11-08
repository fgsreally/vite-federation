import { defineComponent as p, ref as _, openBlock as i, createElementBlock as f, Fragment as m, createElementVNode as e, toDisplayString as a, pushScopeId as h, popScopeId as v, createTextVNode as o } from "vue";
import { s as g } from "./share.js";
const u = (t) => {
  t.projectID = "federation-r", t.fileID = "HelloWorld.vue";
}, b = (t, l) => {
  const r = t.__vccOpts || t;
  for (const [n, c] of l)
    r[n] = c;
  return r;
}, s = (t) => (h("data-v-32b5ceff"), t = t(), v(), t), k = /* @__PURE__ */ s(() => /* @__PURE__ */ e("p", null, [
  /* @__PURE__ */ o(" Recommended IDE setup: "),
  /* @__PURE__ */ e("a", {
    href: "https://code.visualstudio.com/",
    target: "_blank"
  }, "VS Code"),
  /* @__PURE__ */ o(" + "),
  /* @__PURE__ */ e("a", {
    href: "https://github.com/johnsoncodehk/volar",
    target: "_blank"
  }, "Volar")
], -1)), D = /* @__PURE__ */ s(() => /* @__PURE__ */ e("p", null, [
  /* @__PURE__ */ o("See "),
  /* @__PURE__ */ e("code", null, "README.md"),
  /* @__PURE__ */ o(" for more information.")
], -1)), I = /* @__PURE__ */ s(() => /* @__PURE__ */ e("p", null, [
  /* @__PURE__ */ e("a", {
    href: "https://vitejs.dev/guide/features.html",
    target: "_blank"
  }, " Vite Docs "),
  /* @__PURE__ */ o(" | "),
  /* @__PURE__ */ e("a", {
    href: "https://v3.vuejs.org/",
    target: "_blank"
  }, "Vue 3 Docs")
], -1)), y = /* @__PURE__ */ s(() => /* @__PURE__ */ e("p", null, [
  /* @__PURE__ */ o(" Edit "),
  /* @__PURE__ */ e("code", null, "components/HelloWorld.vue"),
  /* @__PURE__ */ o(" to test hot module replacement. ")
], -1)), d = /* @__PURE__ */ p({
  name: "HelloWorld",
  props: {
    msg: null
  },
  setup(t) {
    const l = _(10);
    return g(), (r, n) => (i(), f(m, null, [
      e("h1", null, a(t.msg), 1),
      k,
      D,
      I,
      e("button", {
        type: "button",
        onClick: n[0] || (n[0] = (c) => l.value++)
      }, "count is: " + a(l.value), 1),
      y
    ], 64));
  }
});
typeof u == "function" && u(d);
const V = /* @__PURE__ */ b(d, [["__scopeId", "data-v-32b5ceff"]]);
export {
  V as default
};
