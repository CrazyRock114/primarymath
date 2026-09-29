#!/usr/bin/env node
/* ==========================================================================
   score_test.js —— 计分条专项回归（真点一遍，不只是看源码）
   ---------------------------------------------------------------------------
   场景：5 题故意做「4 对 1 错」。
   断言：计分条显示 4，不是 5。
   背景：原先 quiz.js 回调写成 textContent = done(已作答数)，做错题照样 +1。
   ========================================================================== */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const SITE = process.argv[2] || path.join(__dirname, "..", "site");
const QUIZ = "t";
const KEY = ["A", "B", "C", "D", "A"];   // 5 题的正确答案
const PICK = ["A", "B", "C", "D", "B"];   // 故意第 5 题选错 → 4 对 1 错

/* ---------- 最小 DOM ---------- */
const mk = (tag) => {
  const el = {
  tagName: tag, attrs: {}, children: [], style: {}, dataset: {}, listeners: {},
  _text: "", _html: "", _cls: "",
  classList: { _s: new Set(),
    add(...c) { c.forEach((x) => this._s.add(x)); el._cls = [...this._s].join(" "); },
    remove(...c) { c.forEach((x) => this._s.delete(x)); el._cls = [...this._s].join(" "); },
    contains(c) { return this._s.has(c); } },
  // quiz.js 的 finish() 用 fb.className = "fb show ok" 赋值，
  // 而 countOK/countDone 查的是 .fb.ok —— 必须把 className 同步进 classList
  get className() { return this._cls; },
  set className(v) { this._cls = String(v); this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); },
  get textContent() { return this.children.length ? this.children.map((c) => c.textContent).join("") : this._text; },
  set textContent(v) { this._text = String(v); },
  get innerHTML() { return this._html; },
  set innerHTML(v) { this._html = String(v); this.children = []; },
  appendChild(c) { this.children.push(c); return c; },
  setAttribute(k, v) { this.attrs[k] = String(v); },
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
  addEventListener(e, f) { (this.listeners[e] = this.listeners[e] || []).push(f); },
  removeEventListener() {},
  querySelector() { return null; }, querySelectorAll() { return []; },
  getBoundingClientRect() { return {}; }, focus() {},
  };
  return el;
};

const scoreEl = mk("b");
const optEls = [];                       // optEls[i][k]
for (let i = 0; i < 5; i++) {
  const row = {};
  for (const k of "ABCD") { const o = mk("div"); o.attrs["data-k"] = k; row[k] = o; }
  optEls.push(row);
}
const fbEls = Array.from({ length: 5 }, () => { const f = mk("div"); f.attrs["data-fb"] = ""; return f; });
const qEls = Array.from({ length: 5 }, (_, i) => {
  const q = mk("div");
  q.attrs["data-q"] = String(i);
  q.querySelectorAll = (sel) => (sel === ".opt" ? Object.values(optEls[i]) : []);
  // finish() 用 .opt[data-k="X"] 找用户选中的那个选项来标红
  q.querySelector = (sel) => {
    if (sel === "[data-fb]") return fbEls[i];
    const m = /\.opt\[data-k="([A-D])"\]/.exec(sel);
    if (m) return optEls[i][m[1]] || null;
    return null;
  };
  return q;
});

const host = mk("div");
host.attrs["data-quiz"] = QUIZ;
const verdictEl = mk("span");
host.querySelector = (sel) => {
  if (sel === "[data-score]") return scoreEl;
  if (sel === "[data-verdict]") return verdictEl;
  const m = /\[data-q="(\d+)"\]/.exec(sel);
  if (m) return qEls[+m[1]];
  return null;
};
// countOK/countDone 查的是 host 下 .fb.ok / .fb.show
host.querySelectorAll = (sel) => {
  const m = /\[data-q="(\d+)"\]/.exec(sel);
  if (m) return [qEls[+m[1]]];
  if (sel === ".fb.ok" || sel === ".fb.show" || sel === ".fb") {
    return fbEls.filter((f) => f.classList.contains("fb") &&
      (sel !== ".fb.ok" || f.classList.contains("ok")) &&
      (sel !== ".fb.show" || f.classList.contains("show")));
  }
  return [];
};

const sb = {
  window: null,
  document: {
    querySelectorAll: (s) => (s === "[data-quiz]" ? [host] : []),
    getElementById: () => null, addEventListener: () => {}, readyState: "complete",
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  console, location: { pathname: "/t.html" }, setTimeout, Math, JSON, Object, Array, String, Number, Date,
};
sb.window = sb; sb.globalThis = sb;
const ctx = vm.createContext(sb);

vm.runInContext(`
window.QUIZES = { ${QUIZ}: { title: "t", qs: [
  {stem:"q1", opts:["a","b","c","d"], answer:"A", why:"w1", miss:"m1", kidSay:"k1"},
  {stem:"q2", opts:["a","b","c","d"], answer:"B", why:"w2", miss:"m2", kidSay:"k2"},
  {stem:"q3", opts:["a","b","c","d"], answer:"C", why:"w3", miss:"m3", kidSay:"k3"},
  {stem:"q4", opts:["a","b","c","d"], answer:"D", why:"w4", miss:"m4", kidSay:"k4"},
  {stem:"q5", opts:["a","b","c","d"], answer:"A", why:"w5", miss:"m5", kidSay:"k5"}
]}};
`, ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, "assets/js/quiz.js"), "utf8"), ctx);

/* ---------- 真点：逐题触发 click ---------- */
const fire = (el, type) => (el.listeners[type] || []).forEach((f) => f.call(el, { target: el }));
for (let i = 0; i < 5; i++) fire(optEls[i][PICK[i]], "click");

const shown = String(scoreEl.textContent);
const wrongMarked = Object.values(optEls[4]).filter((o) => o.classList._s.has("wrong")).length;
const fb5 = fbEls[4]._html;

console.log("─".repeat(56));
console.log("  作答: 4 对 1 错（第 5 题选 B，正确是 A）");
console.log("  计分条显示: 答对 " + shown + "/5");
console.log("  第5题标记为 wrong 的选项数: " + wrongMarked);
console.log("  第5题反馈含「家长可以这样说」: " + (fb5.includes("家长可以这样说") ? "是" : "否"));
console.log("─".repeat(56));

let pass = true;
if (shown !== "4") { console.log("  ✗ 计分条应为 4，实际 " + shown + "（做错题被当成答对）"); pass = false; }
else console.log("  ✅ 计分条正确显示 4（答错不再加分）");
if (wrongMarked !== 1) { console.log("  ✗ 错选应被标红 1 个，实际 " + wrongMarked); pass = false; }
else console.log("  ✅ 错选项正确标红");
if (!fb5.includes("家长可以劝说") && !fb5.includes("家长可以这样说")) { console.log("  ✗ 答错反馈缺少家长台词"); pass = false; }
else console.log("  ✅ 答错反馈含家长台词");

process.exit(pass ? 0 : 1);
