/* ==========================================================================
   multiply.js —— 乘除的算理图示
   ---------------------------------------------------------------------------
   核心主张：乘法是加法的打包，除法是乘法的解构。
   竖式的每一步，都是「计数单位在打包 / 拆包」。把这些画出来，
   孩子才明白「为什么从个位算起」「为什么余数必须小于除数」。
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
  const SVGNS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(SVGNS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };

  /* ======================================================================
     ① 数位表乘法 —— 算理的真正核心
     3 × 24：24 = 2 个十 + 4 个一
              3 × 2 个十 = 6 个十
              3 × 4 个一 = 12 个一 = 1 个十 + 2 个一
              6 个十 + 1 个十 = 7 个十
              → 72
     ====================================================================== */
  function placeMulDemo() {
    const host = $("pm-demo"); if (!host) return;
    const a = $("pm-a"), b = $("pm-b");
    const av = $("pm-av"), bv = $("pm-bv");
    const vis = $("pm-vis"), out = $("pm-out");

    function go() {
      const A = +a.value, B = +b.value;
      av.textContent = A; bv.textContent = B;
      // 把 B 拆成十位和个位
      const bT = Math.floor(B / 10), bO = B % 10;
      const aT = Math.floor(A / 10), aO = A % 10;
      const aProdT = A * bT, aProdO = A * bO;   // 两个部分积
      const total = A * B;

      vis.innerHTML = "";
      const W = 640, H = 268;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

      // 表头
      svg.appendChild(T(12, 20, A + " × " + B + " 的算理", { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));

      // 计数单位表头
      const cols = [10, 10, 1, 1, 1, 1, 1, 1];
      const cx = 110, cw = 34, cy = 56;
      cols.forEach((u, i) => {
        svg.appendChild(E("rect", { x: cx + i * cw, y: cy, width: cw - 3, height: 30, rx: 4, fill: u === 10 ? "#e8f1ec" : "#f3efe7", stroke: "#cfc7ba" }));
        svg.appendChild(T(cx + i * cw + cw / 2 - 1, cy + 20, u === 10 ? "十" : "个", { "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: "#5c554d" }));
      });
      svg.appendChild(T(12, cy + 20, B + " 是", { "font-size": 13, fill: "#5c554d" }));
      // 填 B 的小棒
      for (let i = 0; i < bT; i++)
        svg.appendChild(E("rect", { x: cx + i * cw + 4, y: cy + 34, width: cw - 11, height: 24, rx: 3, fill: "#6aa287" }));
      for (let i = 0; i < bO; i++)
        svg.appendChild(E("rect", { x: cx + bT * cw + i * cw + 4, y: cy + 34, width: cw - 11, height: 24, rx: 3, fill: "#9dc7b3" }));
      svg.appendChild(T(12, cy + 52, "是这么拆的：", { "font-size": 12, fill: "#8d857a" }));

      // A 个 B → 两行
      const ry = [cy + 70, cy + 106];
      ry.forEach((y, r) => {
        svg.appendChild(T(12, y + 20, (r === 0 ? "×" : "=") + A + " 个", { "font-size": 12, fill: "#8d857a" }));
        for (let i = 0; i < bT; i++)
          for (let k = 0; k < A; k++)
            svg.appendChild(E("rect", { x: cx + i * cw + 4 + k * 4, y, width: 5, height: 20, rx: 2, fill: "#c4622d", opacity: .8 }));
        for (let i = 0; i < bO; i++)
          for (let k = 0; k < A; k++)
            svg.appendChild(E("rect", { x: cx + bT * cw + i * cw + 4 + k * 4, y, width: 5, height: 20, rx: 2, fill: "#c4622d", opacity: .45 }));
      });

      // 结果行：进位演示
      const oCnt = aProdO;                 // 个位总数
      const carry = Math.floor(oCnt / 10); // 进到十位的
      const oLeft = oCnt % 10;
      const tTotal = aProdT + carry;
      const ry2 = cy + 146;
      svg.appendChild(T(12, ry2 + 20, "进位：", { "font-size": 12, "font-weight": 700, fill: "#c4622d" }));
      // 十位
      for (let i = 0; i < tTotal; i++)
        svg.appendChild(E("rect", { x: cx + i * 13 + 2, y: ry2, width: 9, height: 20, rx: 2, fill: "#2f6b52" }));
      // 个位
      for (let i = 0; i < oLeft; i++)
        svg.appendChild(E("rect", { x: cx + bT * cw + i * 13 + 2, y: ry2, width: 9, height: 20, rx: 2, fill: "#c4622d" }));
      svg.appendChild(T(cx + Math.max(tTotal * 13, bT * cw + oLeft * 13) + 14, ry2 + 16,
        "= " + total, { "font-size": 19, "font-weight": 700, fill: "#2f6b52" }));

      vis.appendChild(svg);

      out.innerHTML =
        "<b>" + B + " = " + bT + " 个十 + " + bO + " 个一</b><br>" +
        A + " × " + bT + " 个十 = <b>" + aProdT + " 个十</b>；" +
        A + " × " + bO + " 个一 = <b>" + aProdO + " 个一</b>。<br>" +
        (carry > 0
          ? "但 " + aProdO + " 个一装不下 10 个，<b>满 10 进 1</b> → " + carry + " 个十、剩 " + oLeft + " 个一。<br>"
          : "个位够装 10 个，<b>不用进位</b>。<br>") +
        "合起来：<b>" + tTotal + " 个十 和 " + oLeft + " 个一 = " + total + "</b><br>" +
        "<span style='color:#c4622d'><strong>竖式为什么这么算，答案就在这张表里</strong>——它不是规定，是<strong>把同一件事画出来</strong>。</span>";
    }
    on("pm-a", "input", go); on("pm-b", "input", go);
    go();
  }

  /* ======================================================================
     ② 为什么必须从个位算起 —— 竖式的方向问题
     ====================================================================== */
  function carryDemo() {
    const host = $("cy-demo"); if (!host) return;
    const vis = $("cy-vis"), out = $("cy-out");
    const mode = $("cy-mode");
    const A = 4, B = 26;   // 4 × 26 = 104，需要连续进位

    function go() {
      const fromRight = mode.value === "1";
      vis.innerHTML = "";
      const W = 640, H = 200;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const x0 = 210, cw = 44, y0 = 58, rh = 40;

      // 横线
      svg.appendChild(E("line", { x1: x0 - 12, y1: y0 + rh, x2: x0 + 4 * cw, y2: y0 + rh, stroke: "#2b2723", "stroke-width": 2 }));
      // 被乘数 26
      ["2", "6"].forEach((d, i) => {
        svg.appendChild(T(x0 + i * cw + cw / 2, y0 + 28, d, { "text-anchor": "middle", "font-size": 24, "font-weight": 700, "font-family": "ui-monospace, monospace" }));
      });
      svg.appendChild(T(x0 - 24, y0 + 28, "4", { "text-anchor": "middle", "font-size": 24, "font-weight": 700, "font-family": "ui-monospace, monospace" }));

      // 计算过程
      const steps = fromRight
        ? [
            { txt: "6 × 4 = 24，个位写 4，向十位进 2", ok: true },
            { txt: "2 × 4 = 8，加上进的 2 = 10，十位写 0，再进 1", ok: true },
            { txt: "答案 104 —— 每一步都对得上", ok: true },
          ]
        : [
            { txt: "先算十位 2 × 4 = 8，个位还空着", ok: true },
            { txt: "再算个位 6 × 4 = 24 —— 但那个「2」是<tspan/>要进到十位的", ok: false },
            { txt: "十位该写几？不知道了。方向反了，卡死", ok: false },
          ];
      let y = 18;
      steps.forEach((s, i) => {
        svg.appendChild(E("circle", { cx: 16, cy: y - 5, r: 9, fill: s.ok ? "#2f6b52" : "#c4622d" }));
        svg.appendChild(T(16, y - 1, String(i + 1), { "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#fff" }));
        svg.appendChild(T(32, y, s.txt.replace("<tspan/>", ""), { "font-size": 13, fill: s.ok ? "#2b2723" : "#c4622d", "font-weight": s.ok ? 400 : 600 }));
        y += 30;
      });
      vis.appendChild(svg);

      out.innerHTML = fromRight
        ? "<b>4 × 26 = 104</b>，从个位起，每一步都清楚。<br>" +
          "因为<strong>进位是从右往左传的</strong>——个位满 10 才有得进给十位。" +
          "如果先算十位，十位根本还不知道个位要进几过来。"
        : "<b>方向反了就卡住了。</b>十位算完写了个 8，可个位待会儿要进 2 过来，<strong>十位到底该写几？</strong><br>" +
          "——写 8 就错了，可你又没法回头改。<br>" +
          "<span style='color:#c4622d'><strong>所以「从个位算起」不是规定，是因为进位只能往左边传。</strong></span>";
    }
    on("cy-mode", "input", go);
    go();
  }

  /* ======================================================================
     ③ 除法竖式：试商
     ====================================================================== */
  function tryDemo() {
    const host = $("ts-demo"); if (!host) return;
    const vis = $("ts-vis"), out = $("ts-out");
    const r = $("ts-r"), rv = $("ts-rv");
    const CASES = {
      0: { n: 3, v: 24 }, 1: { n: 6, v: 42 }, 2: { n: 5, v: 58 },
      3: { n: 7, v: 63 }, 4: { n: 4, v: 39 }, 5: { n: 9, v: 87 },
    };
    function go() {
      const c = CASES[r.value];
      rv.textContent = c.v + " ÷ " + c.n;
      const q = Math.floor(c.v / c.n), rem = c.v % c.n;
      vis.innerHTML = "";
      const W = 640, H = 236;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const x0 = 200, cw = 42, y0 = 66, rh = 38;
      const s = String(c.v).padStart(2, " ");
      // 商：右对齐到被除数的位上，否则 24÷3=8 会被画到十位（正是本页要纠正的错误）
      const qs = String(q).padStart(s.length, " ");
      for (let i = 0; i < s.length; i++)
        svg.appendChild(T(x0 + i * cw + cw / 2, y0 - 8, qs[i], { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#2f6b52", "font-family": "ui-monospace, monospace" }));
      // 被除数
      for (let i = 0; i < s.length; i++)
        svg.appendChild(T(x0 + i * cw + cw / 2, y0 + 28, s[i], { "text-anchor": "middle", "font-size": 22, "font-weight": 700, "font-family": "ui-monospace, monospace" }));
      // 除号
      // 除数与竖式括号原本画在同一 x 上，会叠字；这里分开放
      svg.appendChild(T(x0 - 58, y0 + 28, c.n, { "text-anchor": "middle", "font-size": 20, "font-weight": 700 }));
      svg.appendChild(T(x0 - 26, y0 + 22, ")", { "font-size": 24, "font-weight": 700, transform: "rotate(180 " + (x0 - 26) + " " + (y0 + 30) + ")" }));
      svg.appendChild(E("line", { x1: x0 - 14, y1: y0 - 4, x2: x0 - 14, y2: y0 + 4, stroke: "#2b2723", "stroke-width": 3 }));
      svg.appendChild(E("line", { x1: x0 - 14, y1: y0, x2: x0 + 2 * cw, y2: y0, stroke: "#2b2723", "stroke-width": 3 }));
      // 横线
      svg.appendChild(E("line", { x1: x0 - 14, y1: y0 + rh, x2: x0 + 2 * cw, y2: y0 + rh, stroke: "#2b2723", "stroke-width": 2.5 }));
      // 乘积
      const p = q * c.n;
      for (let i = 0; i < 2; i++)
        svg.appendChild(T(x0 + i * cw + cw / 2, y0 + rh + 28, p.toString()[i] || "", { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#c4622d", "font-family": "ui-monospace, monospace" }));
      // 减号与差
      svg.appendChild(E("line", { x1: x0 - 4, y1: y0 + rh + 44, x2: x0 + 2 * cw, y2: y0 + rh + 44, stroke: "#2b2723", "stroke-width": 2 }));
      svg.appendChild(T(x0 - 14, y0 + rh + 66, rem, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#4a5b8c" }));
      svg.appendChild(T(x0 + 2 * cw + 16, y0 + rh + 66, "余 " + rem, { "font-size": 14, fill: "#4a5b8c" }));
      vis.appendChild(svg);

      // 步骤文案：只有两位数的商才需要「落下一位」，一位商是一步算完
      const stepsHtml = q >= 10
        ? "<b>第一步：看被除数的前两位。</b>" + Math.floor(c.v / 10) + " ÷ " + c.n + " = " + Math.floor(Math.floor(c.v / 10) / c.n) +
          "，所以商的<b>十位</b>写 <b>" + Math.floor(q / 10) + "</b>（它代表「几个十」）。<br>" +
          "<b>第二步：落下一位。</b>" + (c.v % 10) + " ÷ " + c.n + " = " + (q % 10) +
          "……" + rem + "，商的<b>个位</b>写 <b>" + (q % 10) + "</b>。<br>"
        : "<b>商只有一位，一步就能算完：</b>" + c.v + " ÷ " + c.n + " = " + q +
          (rem ? "……" + rem : "") + "。被除数不到除数的 10 倍，不需要「落下一位」。<br>";

      out.innerHTML =
        "<b>" + c.v + " ÷ " + c.n + " = " + q + " …… " + rem + "</b><br>" +
        stepsHtml +
        "检验：<b>" + q + " × " + c.n + " = " + p + "</b>，" + c.v + " − " + p + " = " + rem + "，比除数小 → 试商正确。<br>" +
        (rem > 0
          ? "<span style='color:#c4622d'><strong>余数一定要比除数 " + c.n + " 小。</strong>不然还能再分出一份，那商就还能大一点，说明商试小了。</span>"
          : "<span style='color:#2f6b52'><strong>正好除尽。</strong>商 " + q + " 是最接近的整数答案。</span>");
    }
    on("ts-r", "input", go);
    go();
  }

  /* ======================================================================
     ④ 余数：为什么必须比除数小
     ====================================================================== */
  function remDemo() {
    const host = $("rm-demo"); if (!host) return;
    const vis = $("rm-vis"), out = $("rm-out");
    const d = $("rm-d"), b = $("rm-b");
    const dv = $("rm-dv"), bv = $("rm-bv");

    function go() {
      const D = +d.value, B = +b.value;
      dv.textContent = D; bv.textContent = B;
      const q = Math.floor(B / D), rem = B % D;
      vis.innerHTML = "";
      const W = 640, H = 180;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const n = q, each = D, outX = 24, boxW = 52, gap = 6;
      // 每份
      for (let i = 0; i < n; i++) {
        const x = outX + i * (boxW + gap);
        for (let k = 0; k < each; k++)
          svg.appendChild(E("circle", { cx: x + (k % 2) * 22 + 10, cy: 60 + Math.floor(k / 2) * 24 + 10, r: 9, fill: "#6aa287", stroke: "#fff", "stroke-width": 1.5 }));
        svg.appendChild(T(x + 21, 60 + each * 24 + 34, "第" + (i + 1) + " 份", { "text-anchor": "middle", "font-size": 11, fill: "#8d857a" }));
      }
      // 剩余
      if (rem > 0) {
        const x = outX + n * (boxW + gap);
        svg.appendChild(E("circle", { cx: x + 10, cy: 70, r: 9, fill: "#c4622d" }));
        svg.appendChild(E("circle", { cx: x + 32, cy: 70, r: 9, fill: "#c4622d" }));
        svg.appendChild(T(x + 21, 60 + each * 24 + 34, "剩 " + rem, { "text-anchor": "middle", "font-size": 12, fill: "#c4622d", "font-weight": 700 }));
      }
      vis.appendChild(svg);

      out.innerHTML =
        B + " 个球，每份放 " + D + " 个 → 放了 <b>" + q + "</b> 份，还剩 <b>" + rem + "</b> 个。<br>" +
        (rem < D
          ? "<b>" + rem + " &lt; " + D + "</b> —— 剩下的不够再分一份了，所以商只能是 " + q + "。"
          : "<span style='color:#c4622d'><b>出错了！</b>" + rem + " ≥ " + D + "，说明还能再分一份，商应该是 " + (q + 1) + "。</span>") +
        "<br><span style='color:#c4622d'><strong>余数必须比除数小</strong>，不是规定，是因为<strong>剩下的还不够分一份</strong>。</span>";
    }
    on("rm-d", "input", go); on("rm-b", "input", go);
    go();
  }

  /* ======================================================================
     ⑤ 乘除解决问题：线段图
     ====================================================================== */
  function segDemo() {
    const host = $("sg-demo"); if (!host) return;
    const vis = $("sg-vis"), out = $("sg-out");
    const mode = $("sg-mode");
    function go() {
      const ask = mode.value;    // 0 求几倍量 1 求1倍量
      vis.innerHTML = "";
      const W = 640, H = 190;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const A = 4, K = 3, B = A * K;
      const x0 = 60, w1 = 200;
      // 1倍量
      svg.appendChild(E("rect", { x: x0, y: 48, width: w1, height: 34, rx: 5, fill: "#6aa287" }));
      svg.appendChild(T(x0 + w1 / 2, 70, "小明 1 倍量 " + A, { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#fff" }));
      svg.appendChild(T(x0 - 12, 70, "1倍", { "text-anchor": "end", "font-size": 13, fill: "#5c554d" }));
      // K倍量
      const w2 = w1 * K;
      svg.appendChild(E("rect", { x: x0, y: 112, width: w2, height: 34, rx: 5, fill: "#c4622d", opacity: ask === 0 ? .9 : .35 }));
      for (let i = 1; i < K; i++)
        svg.appendChild(E("line", { x1: x0 + (w2 * i) / K, y1: 112, x2: x0 + (w2 * i) / K, y2: 146, stroke: "#fff", "stroke-width": 2 }));
      svg.appendChild(T(x0 + w2 / 2, 134, K + " 倍量 " + (ask === 0 ? B : "?"), { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#fff" }));
      svg.appendChild(T(x0 - 12, 134, K + "倍", { "text-anchor": "end", "font-size": 13, fill: "#5c554d" }));
      svg.appendChild(T(x0 + w2 + 14, 134, ask === 0 ? "= " + A + " × " + K + " = " + B : "求 ? ", { "font-size": 15, "font-weight": 700, fill: ask === 0 ? "#2f6b52" : "#c4622d" }));
      // 括号
      svg.appendChild(E("path", { d: "M" + x0 + " 154 h" + w2 + " M" + x0 + " 149 v10 M" + (x0 + w2) + " 149 v10", fill: "none", stroke: "#c4622d", "stroke-width": 1.5 }));
      svg.appendChild(T(x0 + w2 / 2, 174, "正好 " + K + " 个 1 倍量", { "text-anchor": "middle", "font-size": 12.5, fill: "#c4622d" }));
      vis.appendChild(svg);
      out.innerHTML = ask === 0
        ? "<b>求几倍量 → 往外扩 → 用乘法。</b>" + A + " × " + K + " = <b>" + B + "</b>。<br>" +
          "画出来看：下层那条是上层的 <strong>" + K + " 倍长</strong>，刚好是 " + K + " 个 1 倍量拼起来的。"
        : "<b>求 1 倍量 → 往里缩 → 用除法。</b>" + B + " ÷ " + K + " = <b>" + A + "</b>。<br>" +
          "下层那条被切成 <strong>" + K + " 段</strong>，每一段就是 1 个 1 倍量。缩回去就知道一份有多大。";
    }
    on("sg-mode", "input", go);
    go();
  }

  /* ---------- 启动 ---------- */
  function boot() { placeMulDemo(); carryDemo(); tryDemo(); remDemo(); segDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
