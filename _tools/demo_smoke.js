#!/usr/bin/env node
/* ==========================================================================
   demo_smoke.js —— 把每个页面的交互图示真跑一遍
   ---------------------------------------------------------------------------
   为什么需要它：静态检查看不出运行时报错（作用域错、拿到 undefined、调不存在
   的方法、SVG 属性名写错）。这些只有真正执行一次才会暴露。
   做法：按 HTML 里出现的 id 造一个最小 DOM 垫片 → 载入该页的 js → 逐个调用
   *Demo 函数 → 收集 console 报错和渲染出的文本。
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const SITE = process.argv[2] || path.join(__dirname, "..", "site");

/* ---------------- 最小 DOM 垫片 ---------------- */
const SVGNS = "http://www.w3.org/2000/svg";

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.attrs = {};
    this.style = {};
    this.dataset = {};
    this._text = "";
    this._html = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.parentNode = null;
    this.listeners = {};
    this.classList = {
      _s: new Set(),
      add: (...c) => c.forEach((x) => this.classList._s.add(x)),
      remove: (...c) => c.forEach((x) => this.classList._s.delete(x)),
      toggle: (c) => (this.classList._s.has(c) ? this.classList._s.delete(c) : this.classList._s.add(c)),
      contains: (c) => this.classList._s.has(c),
    };
  }
  get textContent() {
    if (this.children.length) return this.children.map((c) => c.textContent).join("");
    return this._text;
  }
  set textContent(v) { this._text = String(v); this.children = []; }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); if (v === "") this.children = []; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  append(...cs) { cs.forEach((c) => this.appendChild(typeof c === "string" ? Object.assign(new El("span"), { _text: c }) : c)); }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "value" && !this.value) this.value = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  hasAttribute(k) { return k in this.attrs; }
  addEventListener(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
  removeEventListener() {}
  dispatch(ev, arg) { (this.listeners[ev] || []).forEach((f) => f.call(this, { target: this, ...arg })); }
  click() { this.dispatch("click"); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { x: 0, y: 0, top: 0, left: 0, width: 600, height: 300, right: 600, bottom: 300 }; }
  focus() {}
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
  get nextSibling() { return null; }
  cloneNode() { return new El(this.tagName); }
  insertBefore(n) { return n; }
  closest() { return null; }
  matches() { return false; }
  get offsetWidth() { return 600; }
  get offsetHeight() { return 300; }
}

/* 从 HTML 里抽出所有 id 及其默认 value，造出对应元素 */
function buildDoc(html) {
  const byId = new Map();
  const idRe = /<(\w+)([^>]*?)\bid="([^"]+)"([^>]*)>/g;
  let m;
  while ((m = idRe.exec(html))) {
    const [, tag, a1, id, a2] = m;
    const el = new El(tag);
    const attrs = a1 + a2;
    for (const am of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) {
      el.attrs[am[1]] = am[2];
      if (am[1] === "value") el.value = am[2];
      if (am[1] === "class") am[2].split(/\s+/).filter(Boolean).forEach((c) => el.classList.add(c));
      if (am[1] === "checked") el.checked = true;
    }
    // select 在真浏览器里默认选中第一个 option，垫片必须照做，
    // 否则 sel.value="" 会让下游查表拿到 undefined（8/9 的假报错都源于此）
    if (tag === "select") {
      const body = html.slice(m.index);
      const end = body.indexOf("</select>");
      const inner = end > 0 ? body.slice(0, end) : body;
      const opts = [...inner.matchAll(/<option([^>]*)>/g)].map((o) => o[1]);
      el.options = opts.map((o) => {
        const v = (o.match(/value="([^"]*)"/) || [, ""])[1];
        const t = (o.match(/>([^<]*)</) || [, ""])[1];
        return { value: v, text: t };
      });
      const sel = opts.findIndex((o) => /selected/.test(o));
      el.selectedIndex = sel >= 0 ? sel : 0;
      el.value = sel >= 0 ? (opts[sel].match(/value="([^"]*)"/) || [, ""])[1]
                          : el.value || (el.options[0] && el.options[0].value) || "";
    }
    if (tag === "input" && el.value === "") el.value = "4";
    byId.set(id, el);
  }
  const body = new El("body");
  byId.forEach((el) => body.appendChild(el));
  const doc = {
    body,
    documentElement: new El("html"),
    getElementById: (id) => byId.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (t) => new El(t),
    createElementNS: (ns, t) => new El(t),
    createTextNode: (t) => Object.assign(new El("#text"), { _text: String(t) }),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  doc.documentElement.appendChild(body);
  return { doc, byId };
}

function run() {
  const errors = [];
  const hosts = new Set();
  const dump = [];
  let pages = 0, rendered = 0;

  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : e.name.endsWith(".html") ? [p] : [];
    });

  for (const file of walk(SITE)) {
    const html = fs.readFileSync(file, "utf8");
    const rel = path.relative(SITE, file);
    // 该页引用的 js
    const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((x) => x[1]);
    if (!srcs.length) continue;
    pages++;

    const { doc, byId } = buildDoc(html);
    // --set id=value 可强制某个 select/range 的初始值，用来测别的档位
    for (const kv of process.argv.slice(4)) {
      const [k, v] = kv.split("=");
      if (byId.has(k)) {
        byId.get(k).value = v;
        const i = (byId.get(k).options || []).findIndex((o) => o.value === v);
        if (i >= 0) byId.get(k).selectedIndex = i;
      }
    }
    const logs = [];
    const sandbox = {
      document: doc,
      window: null,
      location: { pathname: "/" + rel.replace(/\\/g, "/"), hash: "", href: "file:///" + rel },
      console: { log: (...a) => logs.push("log:" + a.join(" ")), warn: () => {}, error: (...a) => logs.push("error:" + a.join(" ")) },
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      requestAnimationFrame: (fn) => setTimeout(fn, 0),
      setTimeout, clearTimeout, Math, JSON, Date, Object, Array, String, Number, Boolean, isNaN, parseInt, parseFloat,
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);

    // 页面内联脚本（题库定义等）
    for (const inl of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]) {
      try { vm.runInContext(inl[1], ctx, { timeout: 3000 }); }
      catch (e) { errors.push({ rel, where: "内联脚本", msg: e.message }); }
    }
    // 外部脚本
    for (const s of srcs) {
      const js = path.resolve(path.dirname(file), s);
      if (!fs.existsSync(js)) { errors.push({ rel, where: "缺少脚本 " + s, msg: "文件不存在" }); continue; }
      try { vm.runInContext(fs.readFileSync(js, "utf8"), ctx, { timeout: 5000 }); }
      catch (e) { errors.push({ rel, where: s, msg: e.message }); }
    }

    // 统计渲染出内容的关键容器（-vis / -out）
    for (const [id, el] of byId) {
      if (!/-vis$|-out$/.test(id)) continue;
      const has = el.children.length > 0 || String(el.innerHTML || "").length > 2 || String(el.textContent || "").trim().length > 1;
      if (has) { rendered++; hosts.add(id.replace(/-vis$|-out$/, "")); }
      if (/-out$/.test(id)) {
        const t = (el.innerHTML || el.textContent || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (t) dump.push([rel + " :: " + id, t]);
      }
    }
  }
  return { errors, hosts: hosts.size, pages, rendered, dump };
}

/* 遍历每个 select 的所有档位重跑一遍——只测默认档会漏掉隐藏分支的 bug */
function runAllModes() {
  const base = run();
  const errors = [...base.errors];
  const extra = [];
  const seen = new Set();

  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : e.name.endsWith(".html") ? [p] : [];
    });

  for (const file of walk(SITE)) {
    const html = fs.readFileSync(file, "utf8");
    const rel = path.relative(SITE, file);
    const { byId } = buildDoc(html);
    const selects = [...byId.entries()].filter(([, el]) => Array.isArray(el.options) && el.options.length > 1);
    if (!selects.length) continue;
    // 笛卡尔积（页面里 select 很少，组合数可控）
    const combos = selects.reduce(
      (acc, [id, el]) => acc.flatMap((c) => el.options.map((o) => [...c, [id, o.value]])),
      [[]]
    );
    for (const combo of combos) {
      const key = rel + "|" + JSON.stringify(combo);
      if (seen.has(key)) continue;
      seen.add(key);
      const r = spawnSync(
        process.execPath,
        [__filename, SITE, "--dump", ...combo.map(([k, v]) => k + "=" + v)],
        { encoding: "utf8" }
      );
      if (r.status !== 0) {
        const lines = (r.stdout || "").split("\n").filter((l) => l.trim().startsWith("stat/"));
        if (lines.length) extra.push({ rel, where: combo.map((c) => c.join("=")).join(" & "), msg: lines.join(" | ") });
      }
    }
  }
  return { ...base, errors: errors.concat(extra), modeCount: seen.size };
}

const ALL = process.argv.includes("--all-modes");
const res = ALL ? runAllModes() : run();
const { errors, hosts, pages, rendered, dump, modeCount } = res;
if (process.argv[3] === "--dump") {
  for (const [k, v] of [...dump].sort()) console.log(`@@ ${k}\n${v}\n`);
  process.exit(0);
}
console.log("=".repeat(62));
console.log("图示冒烟测试（最小 DOM 垫片实跑）");
console.log("=".repeat(62));
console.log(`  页面 ${pages} · 成功渲染的图示 ${hosts} 个 · 出内容的容器 ${rendered}` + (modeCount ? ` · 全档位组合 ${modeCount}` : ""));
if (errors.length) {
  console.log(`\n  ✗ ${errors.length} 个问题：`);
  for (const e of errors) console.log(`    ${e.rel}  [${e.where}]  ${e.msg}`);
  process.exit(1);
} else {
  console.log("\n  ✅ 全部图示执行无报错");
}
