var I = typeof global == "object" && global && global.Object === Object && global;
const x = I;
var z = typeof self == "object" && self && self.Object === Object && self, E = x || z || Function("return this")();
const g = E;
var N = g.Symbol;
const c = N;
var T = Object.prototype, F = T.hasOwnProperty, A = T.toString, f = c ? c.toStringTag : void 0;
function D(t) {
  var e = F.call(t, f), r = t[f];
  try {
    t[f] = void 0;
    var n = !0;
  } catch {
  }
  var a = A.call(t);
  return n && (e ? t[f] = r : delete t[f]), a;
}
var M = Object.prototype, H = M.toString;
function G(t) {
  return H.call(t);
}
var R = "[object Null]", K = "[object Undefined]", m = c ? c.toStringTag : void 0;
function j(t) {
  return t == null ? t === void 0 ? K : R : m && m in Object(t) ? D(t) : G(t);
}
function U(t) {
  return t != null && typeof t == "object";
}
var J = "[object Symbol]";
function _(t) {
  return typeof t == "symbol" || U(t) && j(t) == J;
}
function L(t, e) {
  for (var r = -1, n = t == null ? 0 : t.length, a = Array(n); ++r < n; )
    a[r] = e(t[r], r, t);
  return a;
}
var X = Array.isArray;
const y = X;
var Y = 1 / 0, S = c ? c.prototype : void 0, O = S ? S.toString : void 0;
function P(t) {
  if (typeof t == "string")
    return t;
  if (y(t))
    return L(t, P) + "";
  if (_(t))
    return O ? O.call(t) : "";
  var e = t + "";
  return e == "0" && 1 / t == -Y ? "-0" : e;
}
function C(t) {
  var e = typeof t;
  return t != null && (e == "object" || e == "function");
}
var Z = "[object AsyncFunction]", q = "[object Function]", V = "[object GeneratorFunction]", B = "[object Proxy]";
function Q(t) {
  if (!C(t))
    return !1;
  var e = j(t);
  return e == q || e == V || e == Z || e == B;
}
var W = g["__core-js_shared__"];
const d = W;
var $ = function() {
  var t = /[^.]+$/.exec(d && d.keys && d.keys.IE_PROTO || "");
  return t ? "Symbol(src)_1." + t : "";
}();
function k(t) {
  return !!$ && $ in t;
}
var tt = Function.prototype, et = tt.toString;
function rt(t) {
  if (t != null) {
    try {
      return et.call(t);
    } catch {
    }
    try {
      return t + "";
    } catch {
    }
  }
  return "";
}
var nt = /[\\^$.*+?()[\]{}|]/g, at = /^\[object .+?Constructor\]$/, ot = Function.prototype, it = Object.prototype, st = ot.toString, ct = it.hasOwnProperty, ut = RegExp(
  "^" + st.call(ct).replace(nt, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function ft(t) {
  if (!C(t) || k(t))
    return !1;
  var e = Q(t) ? ut : at;
  return e.test(rt(t));
}
function ht(t, e) {
  return t == null ? void 0 : t[e];
}
function w(t, e) {
  var r = ht(t, e);
  return ft(r) ? r : void 0;
}
function lt(t, e) {
  return t === e || t !== t && e !== e;
}
var pt = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, dt = /^\w*$/;
function gt(t, e) {
  if (y(t))
    return !1;
  var r = typeof t;
  return r == "number" || r == "symbol" || r == "boolean" || t == null || _(t) ? !0 : dt.test(t) || !pt.test(t) || e != null && t in Object(e);
}
var _t = w(Object, "create");
const h = _t;
function yt() {
  this.__data__ = h ? h(null) : {}, this.size = 0;
}
function bt(t) {
  var e = this.has(t) && delete this.__data__[t];
  return this.size -= e ? 1 : 0, e;
}
var vt = "__lodash_hash_undefined__", mt = Object.prototype, St = mt.hasOwnProperty;
function Ot(t) {
  var e = this.__data__;
  if (h) {
    var r = e[t];
    return r === vt ? void 0 : r;
  }
  return St.call(e, t) ? e[t] : void 0;
}
var $t = Object.prototype, Tt = $t.hasOwnProperty;
function jt(t) {
  var e = this.__data__;
  return h ? e[t] !== void 0 : Tt.call(e, t);
}
var Pt = "__lodash_hash_undefined__";
function Ct(t, e) {
  var r = this.__data__;
  return this.size += this.has(t) ? 0 : 1, r[t] = h && e === void 0 ? Pt : e, this;
}
function i(t) {
  var e = -1, r = t == null ? 0 : t.length;
  for (this.clear(); ++e < r; ) {
    var n = t[e];
    this.set(n[0], n[1]);
  }
}
i.prototype.clear = yt;
i.prototype.delete = bt;
i.prototype.get = Ot;
i.prototype.has = jt;
i.prototype.set = Ct;
function wt() {
  this.__data__ = [], this.size = 0;
}
function l(t, e) {
  for (var r = t.length; r--; )
    if (lt(t[r][0], e))
      return r;
  return -1;
}
var It = Array.prototype, xt = It.splice;
function zt(t) {
  var e = this.__data__, r = l(e, t);
  if (r < 0)
    return !1;
  var n = e.length - 1;
  return r == n ? e.pop() : xt.call(e, r, 1), --this.size, !0;
}
function Et(t) {
  var e = this.__data__, r = l(e, t);
  return r < 0 ? void 0 : e[r][1];
}
function Nt(t) {
  return l(this.__data__, t) > -1;
}
function Ft(t, e) {
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
u.prototype.clear = wt;
u.prototype.delete = zt;
u.prototype.get = Et;
u.prototype.has = Nt;
u.prototype.set = Ft;
var At = w(g, "Map");
const Dt = At;
function Mt() {
  this.size = 0, this.__data__ = {
    hash: new i(),
    map: new (Dt || u)(),
    string: new i()
  };
}
function Ht(t) {
  var e = typeof t;
  return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? t !== "__proto__" : t === null;
}
function p(t, e) {
  var r = t.__data__;
  return Ht(e) ? r[typeof e == "string" ? "string" : "hash"] : r.map;
}
function Gt(t) {
  var e = p(this, t).delete(t);
  return this.size -= e ? 1 : 0, e;
}
function Rt(t) {
  return p(this, t).get(t);
}
function Kt(t) {
  return p(this, t).has(t);
}
function Ut(t, e) {
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
s.prototype.clear = Mt;
s.prototype.delete = Gt;
s.prototype.get = Rt;
s.prototype.has = Kt;
s.prototype.set = Ut;
var Jt = "Expected a function";
function b(t, e) {
  if (typeof t != "function" || e != null && typeof e != "function")
    throw new TypeError(Jt);
  var r = function() {
    var n = arguments, a = e ? e.apply(this, n) : n[0], o = r.cache;
    if (o.has(a))
      return o.get(a);
    var v = t.apply(this, n);
    return r.cache = o.set(a, v) || o, v;
  };
  return r.cache = new (b.Cache || s)(), r;
}
b.Cache = s;
var Lt = 500;
function Xt(t) {
  var e = b(t, function(n) {
    return r.size === Lt && r.clear(), n;
  }), r = e.cache;
  return e;
}
var Yt = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Zt = /\\(\\)?/g, qt = Xt(function(t) {
  var e = [];
  return t.charCodeAt(0) === 46 && e.push(""), t.replace(Yt, function(r, n, a, o) {
    e.push(a ? o.replace(Zt, "$1") : n || r);
  }), e;
});
const Vt = qt;
function Bt(t) {
  return t == null ? "" : P(t);
}
function Qt(t, e) {
  return y(t) ? t : gt(t, e) ? [t] : Vt(Bt(t));
}
var Wt = 1 / 0;
function kt(t) {
  if (typeof t == "string" || _(t))
    return t;
  var e = t + "";
  return e == "0" && 1 / t == -Wt ? "-0" : e;
}
function te(t, e) {
  e = Qt(e, t);
  for (var r = 0, n = e.length; t != null && r < n; )
    t = t[kt(e[r++])];
  return r && r == n ? t : void 0;
}
function ee(t, e, r) {
  var n = t == null ? void 0 : te(t, e);
  return n === void 0 ? r : n;
}
let re = { a: 1 };
function ne(t) {
  console.log(t), console.log(ee(re, "a"), 100);
}
export {
  ne as test
};
