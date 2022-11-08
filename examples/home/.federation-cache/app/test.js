import { s as I } from "./share.js";
var x = typeof global == "object" && global && global.Object === Object && global;
const z = x;
var E = typeof self == "object" && self && self.Object === Object && self, N = z || E || Function("return this")();
const g = N;
var F = g.Symbol;
const c = F;
var T = Object.prototype, A = T.hasOwnProperty, D = T.toString, f = c ? c.toStringTag : void 0;
function M(t) {
  var e = A.call(t, f), r = t[f];
  try {
    t[f] = void 0;
    var n = !0;
  } catch {
  }
  var o = D.call(t);
  return n && (e ? t[f] = r : delete t[f]), o;
}
var H = Object.prototype, G = H.toString;
function R(t) {
  return G.call(t);
}
var K = "[object Null]", U = "[object Undefined]", m = c ? c.toStringTag : void 0;
function j(t) {
  return t == null ? t === void 0 ? U : K : m && m in Object(t) ? M(t) : R(t);
}
function J(t) {
  return t != null && typeof t == "object";
}
var L = "[object Symbol]";
function _(t) {
  return typeof t == "symbol" || J(t) && j(t) == L;
}
function X(t, e) {
  for (var r = -1, n = t == null ? 0 : t.length, o = Array(n); ++r < n; )
    o[r] = e(t[r], r, t);
  return o;
}
var Y = Array.isArray;
const y = Y;
var Z = 1 / 0, S = c ? c.prototype : void 0, O = S ? S.toString : void 0;
function P(t) {
  if (typeof t == "string")
    return t;
  if (y(t))
    return X(t, P) + "";
  if (_(t))
    return O ? O.call(t) : "";
  var e = t + "";
  return e == "0" && 1 / t == -Z ? "-0" : e;
}
function C(t) {
  var e = typeof t;
  return t != null && (e == "object" || e == "function");
}
var q = "[object AsyncFunction]", V = "[object Function]", B = "[object GeneratorFunction]", Q = "[object Proxy]";
function W(t) {
  if (!C(t))
    return !1;
  var e = j(t);
  return e == V || e == B || e == q || e == Q;
}
var k = g["__core-js_shared__"];
const d = k;
var $ = function() {
  var t = /[^.]+$/.exec(d && d.keys && d.keys.IE_PROTO || "");
  return t ? "Symbol(src)_1." + t : "";
}();
function tt(t) {
  return !!$ && $ in t;
}
var et = Function.prototype, rt = et.toString;
function nt(t) {
  if (t != null) {
    try {
      return rt.call(t);
    } catch {
    }
    try {
      return t + "";
    } catch {
    }
  }
  return "";
}
var ot = /[\\^$.*+?()[\]{}|]/g, at = /^\[object .+?Constructor\]$/, it = Function.prototype, st = Object.prototype, ct = it.toString, ut = st.hasOwnProperty, ft = RegExp(
  "^" + ct.call(ut).replace(ot, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function ht(t) {
  if (!C(t) || tt(t))
    return !1;
  var e = W(t) ? ft : at;
  return e.test(nt(t));
}
function lt(t, e) {
  return t == null ? void 0 : t[e];
}
function w(t, e) {
  var r = lt(t, e);
  return ht(r) ? r : void 0;
}
function pt(t, e) {
  return t === e || t !== t && e !== e;
}
var dt = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, gt = /^\w*$/;
function _t(t, e) {
  if (y(t))
    return !1;
  var r = typeof t;
  return r == "number" || r == "symbol" || r == "boolean" || t == null || _(t) ? !0 : gt.test(t) || !dt.test(t) || e != null && t in Object(e);
}
var yt = w(Object, "create");
const h = yt;
function bt() {
  this.__data__ = h ? h(null) : {}, this.size = 0;
}
function vt(t) {
  var e = this.has(t) && delete this.__data__[t];
  return this.size -= e ? 1 : 0, e;
}
var mt = "__lodash_hash_undefined__", St = Object.prototype, Ot = St.hasOwnProperty;
function $t(t) {
  var e = this.__data__;
  if (h) {
    var r = e[t];
    return r === mt ? void 0 : r;
  }
  return Ot.call(e, t) ? e[t] : void 0;
}
var Tt = Object.prototype, jt = Tt.hasOwnProperty;
function Pt(t) {
  var e = this.__data__;
  return h ? e[t] !== void 0 : jt.call(e, t);
}
var Ct = "__lodash_hash_undefined__";
function wt(t, e) {
  var r = this.__data__;
  return this.size += this.has(t) ? 0 : 1, r[t] = h && e === void 0 ? Ct : e, this;
}
function i(t) {
  var e = -1, r = t == null ? 0 : t.length;
  for (this.clear(); ++e < r; ) {
    var n = t[e];
    this.set(n[0], n[1]);
  }
}
i.prototype.clear = bt;
i.prototype.delete = vt;
i.prototype.get = $t;
i.prototype.has = Pt;
i.prototype.set = wt;
function It() {
  this.__data__ = [], this.size = 0;
}
function l(t, e) {
  for (var r = t.length; r--; )
    if (pt(t[r][0], e))
      return r;
  return -1;
}
var xt = Array.prototype, zt = xt.splice;
function Et(t) {
  var e = this.__data__, r = l(e, t);
  if (r < 0)
    return !1;
  var n = e.length - 1;
  return r == n ? e.pop() : zt.call(e, r, 1), --this.size, !0;
}
function Nt(t) {
  var e = this.__data__, r = l(e, t);
  return r < 0 ? void 0 : e[r][1];
}
function Ft(t) {
  return l(this.__data__, t) > -1;
}
function At(t, e) {
  var r = this.__data__, n = l(r, t);
  return n < 0 ? (++this.size, r.push([t, e])) : r[n][1] = e, this;
}
function u(t) {
  var e = -1, r = t == null ? 0 : t.length;
  for (this.clear(); ++e < r; ) {
    var n = t[e];
    this.set(n[0], n[1]);
  }
}
u.prototype.clear = It;
u.prototype.delete = Et;
u.prototype.get = Nt;
u.prototype.has = Ft;
u.prototype.set = At;
var Dt = w(g, "Map");
const Mt = Dt;
function Ht() {
  this.size = 0, this.__data__ = {
    hash: new i(),
    map: new (Mt || u)(),
    string: new i()
  };
}
function Gt(t) {
  var e = typeof t;
  return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? t !== "__proto__" : t === null;
}
function p(t, e) {
  var r = t.__data__;
  return Gt(e) ? r[typeof e == "string" ? "string" : "hash"] : r.map;
}
function Rt(t) {
  var e = p(this, t).delete(t);
  return this.size -= e ? 1 : 0, e;
}
function Kt(t) {
  return p(this, t).get(t);
}
function Ut(t) {
  return p(this, t).has(t);
}
function Jt(t, e) {
  var r = p(this, t), n = r.size;
  return r.set(t, e), this.size += r.size == n ? 0 : 1, this;
}
function s(t) {
  var e = -1, r = t == null ? 0 : t.length;
  for (this.clear(); ++e < r; ) {
    var n = t[e];
    this.set(n[0], n[1]);
  }
}
s.prototype.clear = Ht;
s.prototype.delete = Rt;
s.prototype.get = Kt;
s.prototype.has = Ut;
s.prototype.set = Jt;
var Lt = "Expected a function";
function b(t, e) {
  if (typeof t != "function" || e != null && typeof e != "function")
    throw new TypeError(Lt);
  var r = function() {
    var n = arguments, o = e ? e.apply(this, n) : n[0], a = r.cache;
    if (a.has(o))
      return a.get(o);
    var v = t.apply(this, n);
    return r.cache = a.set(o, v) || a, v;
  };
  return r.cache = new (b.Cache || s)(), r;
}
b.Cache = s;
var Xt = 500;
function Yt(t) {
  var e = b(t, function(n) {
    return r.size === Xt && r.clear(), n;
  }), r = e.cache;
  return e;
}
var Zt = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, qt = /\\(\\)?/g, Vt = Yt(function(t) {
  var e = [];
  return t.charCodeAt(0) === 46 && e.push(""), t.replace(Zt, function(r, n, o, a) {
    e.push(o ? a.replace(qt, "$1") : n || r);
  }), e;
});
const Bt = Vt;
function Qt(t) {
  return t == null ? "" : P(t);
}
function Wt(t, e) {
  return y(t) ? t : _t(t, e) ? [t] : Bt(Qt(t));
}
var kt = 1 / 0;
function te(t) {
  if (typeof t == "string" || _(t))
    return t;
  var e = t + "";
  return e == "0" && 1 / t == -kt ? "-0" : e;
}
function ee(t, e) {
  e = Wt(e, t);
  for (var r = 0, n = e.length; t != null && r < n; )
    t = t[te(e[r++])];
  return r && r == n ? t : void 0;
}
function re(t, e, r) {
  var n = t == null ? void 0 : ee(t, e);
  return n === void 0 ? r : n;
}
let ne = { a: 1 };
function ae() {
  console.log("remote-test"), console.log(re(ne, "a")), I();
}
export {
  ae as test
};
