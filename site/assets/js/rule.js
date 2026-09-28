/* ==========================================================================
   rule.js —— 运算规则图示
   ---------------------------------------------------------------------------
   核心主张：所有运算定律都只有一个来源 —— 计数单位的「合并」与「打包」。
   孩子背「a×b=b×a」没有用；看见「小棒先合左边和先合右边一样」才有用。
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };

  /* ======================================================================
     ① 运算顺序 —— 先算谁，后算谁
     ====================================================================== */
  function orderDemo() {
    const host = $("or-demo"); if (!host) return;
    const vis = $("or-vis"), out = $("or-out");
    const mode = $("or-mode");
    const CASES = {
      0: { e: "36 + 24 × 2", ans: 84, tree: [1, 0, 1] },
      1: { e: "(36 + 24) × 2", ans: 120, tree: [0, 1, 1] },
      2: { e: "36 ÷ 2 + 24", ans: 42, tree: [1, 0, 1] },
      3: { e: "[(36 + 24) × 2] ÷ 5", ans: 24, tree: [0, 0, 1] },
    };
    function go() {
      const c = CASES[mode.value];
      vis.innerHTML = "";
      const W = 640, H = 200;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      // 步骤条
      const steps = ["先算括号里的", "再算乘除", "最后算加减"];
      c.tree.forEach((lv, i) => {
        const x = 40 + i * 200;
        svg.appendChild(E("rect", { x, y: 40, width: 170, height: 52, rx: 10, fill: lv ? "#e8f1ec" : "#f3efe7", stroke: lv ? "#2f6b52" : "#cfc7ba", "stroke-width": 2 }));
        svg.appendChild(T(x + 85, 62, steps[lv], { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(x + 85, 82, lv ? "✓ 本题用到了" : "— 本题没用到", { "text-anchor": "middle", "font-size": 11, fill: "#8d857a" }));
        if (i < 2) svg.appendChild(T(x + 185, 66, "→", { "text-anchor": "middle", "font-size": 18, fill: "#c4622d" }));
      });
      // 竖式展示
      svg.appendChild(T(40, 150, c.e + " = " + c.ans, { "font-size": 22, "font-weight": 700, "font-family": "ui-monospace, monospace", fill: "#2b2723" }));
      vis.appendChild(svg);
      out.innerHTML =
        "<b>" + c.e + " = " + c.ans + "</b><br>" +
        (c.tree[0] === 0
          ? "这一题<strong>有括号</strong>，所以<strong>第一步是括号里的</strong>，哪怕里面是加减也要先算。<br>"
          : "这一题<strong>没有括号</strong>，直接进入第二步：<strong>先乘除，后加减</strong>。<br>") +
        (c.tree[1] === 1
          ? "有乘除 → <strong>先算乘除</strong>。<br>"
          : "没有乘除 → <strong>直接算加减</strong>。<br>") +
        "<span style='color:#c4622d'><strong>顺序只有三层：括号 → 乘除 → 加减。</strong><br>" +
        "孩子记不住，根因是<strong>不知道每一层在干什么</strong>——其实每层都是「先做更紧的」。</span>";
    }
    on("or-mode", "input", go);
    go();
  }

  /* ======================================================================
     ② 运算定律 —— 全部来自「小棒合并」
     ====================================================================== */
  function lawDemo() {
    const host = $("lw-demo"); if (!host) return;
    const vis = $("lw-vis"), out = $("lw-out");
    const mode = $("lw-mode");
    const LAWS = {
      0: { n: "加法交换律", f: "a + b = b + a", t: "3 + 5 = 8，5 + 3 = 8", note: "合并小棒时，先合哪一堆都一样多。" },
      1: { n: "加法结合律", f: "(a + b) + c = a + (b + c)", t: "(3+5)+8 = 16，3+(5+8) = 16", note: "合并只关心「合了多少根」，不关心分几批合。" },
      2: { n: "乘法交换律", f: "a × b = b × a", t: "3 × 5 = 15，5 × 3 = 15", note: "同一个长方形，从长边数还是从宽边数，格数一样。" },
      3: { n: "乘法结合律", f: "(a × b) × c = a × (b × c)", t: "(3×5)×7 = 105，3×(5×7) = 105", note: "打包的顺序不影响总包数——3 份、每份 5 个，共 7 份。" },
      4: { n: "乘法分配律", f: "(a + b) × c = a×c + b×c", t: "(3+5)×7 = 56，3×7+5×7 = 56", note: "整块打包 = 分别打包再合起来。这就是「打包」的定义。" },
    };
    function go() {
      const L = LAWS[mode.value];
      vis.innerHTML = "";
      const W = 640, H = 170;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const a = 3, b = 5, c = 7;
      // 左边：3 排
      const drawRows = (x0, label, rows, color) => {
        rows.forEach((cnt, r) => {
          for (let i = 0; i < cnt; i++)
            svg.appendChild(E("rect", { x: x0 + i * 16, y: 40 + r * 26, width: 11, height: 20, rx: 2, fill: color, opacity: .8 }));
        });
        svg.appendChild(T(x0 - 12, 40 + rows.length * 13, label, { "text-anchor": "end", "font-size": 13, fill: "#5c554d" }));
      };
      if (mode.value === "4") {
        // 分配律：两个长方形拼成一个大长方形
        svg.appendChild(E("rect", { x: 60, y: 40, width: 200, height: 60, fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2 }));
        svg.appendChild(E("rect", { x: 60, y: 100, width: 120, height: 40, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        svg.appendChild(E("rect", { x: 180, y: 100, width: 80, height: 40, fill: "#c4622d", opacity: .55, stroke: "#c4622d", "stroke-width": 2 }));
        svg.appendChild(T(160, 76, "整块：8 × 7", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(120, 126, "3 × 7", { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
        svg.appendChild(T(220, 126, "5 × 7", { "text-anchor": "middle", "font-size": 12, fill: "#c4622d" }));
        svg.appendChild(T(300, 90, "整块的面积", { "font-size": 12, fill: "#8d857a" }));
        svg.appendChild(T(300, 108, "=", { "font-size": 12, fill: "#8d857a" }));
        svg.appendChild(T(330, 99, "两块之和", { "font-size": 12, "font-weight": 700, fill: "#2f6b52" }));
      } else if (mode.value === "2" || mode.value === "3") {
        // 乘法定律画的是「a 排、每排 b 个」的阵列，不是相加的小棒
        const grid = (x0, rows, per, color) => {
          for (let r = 0; r < rows; r++)
            for (let i = 0; i < per; i++)
              svg.appendChild(E("rect", { x: x0 + i * 16, y: 40 + r * 22, width: 11, height: 16, rx: 2, fill: color, opacity: .82 }));
        };
        if (mode.value === "2") {
          // 交换律：3 排每排 5 个  vs  5 排每排 3 个
          grid(60, a, b, "#6aa287");
          svg.appendChild(T(100, 150, "3 排 × 每排 5 个", { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
          grid(240, b, a, "#c4622d");
          svg.appendChild(T(280, 150, "5 排 × 每排 3 个", { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
          svg.appendChild(T(400, 90, "格数一样：3 × 5 = 5 × 3 = 15", { "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
        } else {
          // 结合律：先 3 排每排 5 个（15 个），再打包成 7 份每份 15
          grid(60, a, b, "#6aa287");
          svg.appendChild(T(100, 150, "先打包：3 排 × 每排 5 个 = 15 个", { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
          grid(240, c, a * b > 14 ? 14 : a * b, "#c4622d");
          svg.appendChild(T(320, 150, "再打包：7 份 × 每份 15 个 = 105 个", { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
          svg.appendChild(T(500, 90, "总数不变：(3×5)×7 = 3×(5×7)", { "font-size": 13, "font-weight": 700, fill: "#2f6b52" }));
        }
      } else {
        drawRows(70, "A", [a], "#6aa287");
        drawRows(70, "B", [b], "#c4622d");
        drawRows(70, "A+B", [a + b], "#2f6b52");
        svg.appendChild(T(210, 60, "+", { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#8d857a" }));
        drawRows(250, "B", [b], "#c4622d");
        drawRows(250, "A", [a], "#6aa287");
        drawRows(250, "结果", [a + b], "#2f6b52");
        svg.appendChild(T(400, 90, "总数一样：" + (a + b), { "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
      }
      vis.appendChild(svg);
      out.innerHTML =
        "<b style='color:#2f6b52;font-size:17px'>" + L.n + "：<span style='font-family:ui-monospace,monospace'>" + L.f + "</span></b><br>" +
        "代入验证：<b>" + L.t + "</b><br>" +
        "<span style='color:#c4622d'><strong>为什么成立：</strong>" + L.note + "</span>";
    }
    on("lw-mode", "input", go);
    go();
  }

  /* ======================================================================
     ③ 小数乘法 —— 计数单位相乘
     0.3 × 0.2 = 3个0.1 × 2个0.1 = 6个0.01 = 0.06
     ====================================================================== */
  function decMulDemo() {
    const host = $("dm-demo"); if (!host) return;
    const vis = $("dm-vis"), out = $("dm-out");
    const a = $("dm-a"), b = $("dm-b");
    const av = $("dm-av"), bv = $("dm-bv");

    function go() {
      const A = +a.value / 10, B = +b.value / 10;   // 0.1 ~ 0.9
      av.textContent = A.toFixed(1); bv.textContent = B.toFixed(1);
      const ai = +a.value, bi = +b.value;
      vis.innerHTML = "";
      const W = 640, H = 200;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      // 左边：ai 个 0.1
      svg.appendChild(T(14, 30, A.toFixed(1) + " = " + ai + " 个 0.1", { "font-size": 13, "font-weight": 700, fill: "#2f6b52" }));
      for (let i = 0; i < ai; i++) svg.appendChild(E("rect", { x: 20 + i * 26, y: 40, width: 20, height: 20, rx: 3, fill: "#6aa287" }));
      // 右边：bi 个 0.1
      svg.appendChild(T(14, 92, B.toFixed(1) + " = " + bi + " 个 0.1", { "font-size": 13, "font-weight": 700, fill: "#4a5b8c" }));
      for (let i = 0; i < bi; i++) svg.appendChild(E("rect", { x: 20 + i * 26, y: 102, width: 20, height: 20, rx: 3, fill: "#7d8cbe" }));
      // 交叉：bi 行 × ai 个
      svg.appendChild(T(300, 30, "每个 0.1 × 每个 0.1 = 一个 0.01", { "font-size": 12.5, fill: "#8d857a" }));
      for (let r = 0; r < bi; r++)
        for (let cI = 0; cI < ai; cI++)
          svg.appendChild(E("rect", { x: 300 + cI * 22, y: 44 + r * 22, width: 18, height: 18, rx: 2, fill: "#c4622d", opacity: .75 }));
      svg.appendChild(T(300, 44 + bi * 22 + 20, "共 " + ai + " × " + bi + " = " + ai * bi + " 个 0.01", { "font-size": 13, "font-weight": 700, fill: "#c4622d" }));
      vis.appendChild(svg);

      const prod = ai * bi;   // 个 0.01
      const val = (A * B).toFixed(2);
      out.innerHTML =
        "<b>" + A.toFixed(1) + " × " + B.toFixed(1) + " = " + val + "</b><br>" +
        "<b>" + A.toFixed(1) + "</b> 是 <b>" + ai + " 个 0.1</b>，<b>" + B.toFixed(1) + "</b> 是 <b>" + bi + " 个 0.1</b>。<br>" +
        "两边<strong>相乘</strong>，就是 <b>" + ai + " × " + bi + " = " + prod + " 个 0.01</b>。<br>" +
        "<span style='color:#c4622d'><strong>数相乘，单位也相乘</strong>：0.1 × 0.1 = 0.01。<br>" +
        "所以<strong>小数点位数 = 两个因数小数位数之和</strong>——不是规定，是<strong>单位相乘的结果</strong>。</span>";
    }
    on("dm-a", "input", go); on("dm-b", "input", go);
    go();
  }

  /* ======================================================================
     ④ 三位数乘两位数 —— 两个部分积 + 对位
     ====================================================================== */
  function bigMulDemo() {
    const host = $("bm-demo"); if (!host) return;
    const vis = $("bm-vis"), out = $("bm-out");
    const mode = $("bm-mode");
    const A = 234, B = 45;
    function go() {
      const step = mode.value;
      vis.innerHTML = "";
      const W = 640, H = 236, x0 = 230, cw = 46, y0 = 50, rh = 36;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      svg.appendChild(T(x0 - 26, y0 + 28, A, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, "font-family": "ui-monospace, monospace" }));
      // × B 的个位
      const p0 = A * 5, p1 = A * 4;
      let y = y0;
      // 第二个因数
      svg.appendChild(T(x0 - 26, y0 + rh + 28, "×", { "text-anchor": "middle", "font-size": 20, "font-weight": 700 }));
      "45".split("").forEach((d, i) => svg.appendChild(T(x0 + i * cw + cw / 2, y0 + rh + 28, d, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, "font-family": "ui-monospace, monospace" })));
      svg.appendChild(E("line", { x1: x0 - 44, y1: y0 + rh + 38, x2: x0 + 4 * cw, y2: y0 + rh + 38, stroke: "#2b2723", "stroke-width": 2.5 }));
      y = y0 + rh + 38;
      // 部分积 1：×5
      let show = step >= 1;
      if (show) {
        String(p0).split("").forEach((d, i) => svg.appendChild(T(x0 + i * cw + cw / 2, y + 28, d, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#2f6b52", "font-family": "ui-monospace, monospace" })));
        svg.appendChild(T(x0 - 26, y + 28, "①", { "text-anchor": "middle", "font-size": 14, fill: "#2f6b52", "font-weight": 700 }));
      }
      if (step >= 1) svg.appendChild(E("line", { x1: x0 - 44, y1: y + 38, x2: x0 + 4 * cw, y2: y + 38, stroke: "#cfc7ba", "stroke-width": 1.5 }));
      y += 44;
      // 部分积 2：×4（末位对齐十位）
      show = step >= 2;
      if (show) {
        String(p1).split("").forEach((d, i) => svg.appendChild(T(x0 + (i + 1) * cw + cw / 2, y + 28, d, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#c4622d", "font-family": "ui-monospace, monospace" })));
        svg.appendChild(T(x0 - 26, y + 28, "②", { "text-anchor": "middle", "font-size": 14, fill: "#c4622d", "font-weight": 700 }));
        svg.appendChild(T(x0 + 4 * cw + 14, y + 28, "← 末位对齐十位", { "font-size": 12, fill: "#c4622d" }));
      }
      if (step >= 2) svg.appendChild(E("line", { x1: x0 - 44, y1: y + 38, x2: x0 + 4 * cw, y2: y + 38, stroke: "#cfc7ba", "stroke-width": 1.5 }));
      y += 44;
      // 结果
      if (step >= 3) {
        String(A * B).split("").forEach((d, i) => svg.appendChild(T(x0 + i * cw + cw / 2, y + 28, d, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#2b2723", "font-family": "ui-monospace, monospace" })));
      }
      vis.appendChild(svg);
      out.innerHTML =
        "<b>" + A + " × " + B + " = " + (A * B) + "</b><br>" +
        (step < 1 ? "第一步：<strong>用第二个因数的个位 5 去除</strong> → " + A + " × 5 = " + p0 + "<br>"
          : step < 2 ? "<b>① 已写出：" + A + " × 5 = " + p0 + "</b>（" + A + " 个一乘 5）<br>下一步：用十位 4 去除。<br>"
            : step < 3 ? "<b>② 已写出：" + A + " × 4 = " + p1 + "</b>，但它<strong>表示 40 个 " + A + "</strong>，<br>所以<strong>末位要和十位对齐</strong>（左移一位）。<br>下一步：两行相加。<br>"
              : "<b>两行相加：</b>" + p0 + " + " + (p1 * 10) + " = <b>" + (A * B) + "</b><br>" +
                "<span style='color:#c4622d'><strong>为什么末位对齐十位？</strong><br>因为 4 在<strong>十位</strong>上，它代表 40 个 234，<br>而 40 个 234 的末位就是<strong>十位</strong>。<strong>对齐的是位置，不是好看。</strong></span>");
    }
    on("bm-mode", "input", go);
    go();
  }

  /* ======================================================================
     ⑤ 除数是两位数 —— 把除数「看小」试商
     ====================================================================== */
  function div2Demo() {
    const host = $("d2-demo"); if (!host) return;
    const vis = $("d2-vis"), out = $("d2-out");
    const sel = $("d2-sel");
    const CASES = {
      0: { v: 96, d: 24 }, 1: { v: 72, d: 18 }, 2: { v: 144, d: 12 },
      3: { v: 85, d: 17 }, 4: { v: 91, d: 13 },
    };
    function go() {
      const c = CASES[sel.value];
      const q = Math.floor(c.v / c.d), rem = c.v % c.d;
      vis.innerHTML = "";
      const W = 640, H = 210;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      // 试商范围
      svg.appendChild(T(30, 28, "商的个位可能是：", { "font-size": 13, "font-weight": 700, fill: "#2b2723" }));
      const lo = Math.max(1, Math.floor(c.d / 10));
      const hi = Math.min(9, Math.ceil(c.v / c.d));
      for (let i = lo; i <= hi; i++) {
        const x = 180 + (i - lo) * 46;
        const hit = i === q % 10;
        svg.appendChild(E("rect", { x, y: 12, width: 38, height: 30, rx: 6, fill: hit ? "#e8f1ec" : "#f3efe7", stroke: hit ? "#2f6b52" : "#cfc7ba", "stroke-width": hit ? 2 : 1.5 }));
        svg.appendChild(T(x + 19, 33, i, { "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: hit ? "#2f6b52" : "#8d857a", "font-family": "ui-monospace, monospace" }));
        svg.appendChild(T(x + 19, 57, "×" + c.d + "=" + i * c.d, { "text-anchor": "middle", "font-size": 9.5, fill: "#8d857a" }));
      }
      // 竖式
      const x0 = 220, cw = 44, y0 = 92, rh = 36;
      const s = String(c.v).padStart(3, " ");
      String(q).padStart(3, " ").split("").forEach((ch, i) => { if (ch.trim()) svg.appendChild(T(x0 + i * cw + cw / 2, y0, ch, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#2f6b52", "font-family": "ui-monospace, monospace" })); });
      s.split("").forEach((ch, i) => svg.appendChild(T(x0 + i * cw + cw / 2, y0 + 28, ch, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, "font-family": "ui-monospace, monospace" })));
      svg.appendChild(T(x0 - 34, y0 + 28, c.d, { "text-anchor": "middle", "font-size": 19, "font-weight": 700 }));
      svg.appendChild(E("line", { x1: x0 - 52, y1: y0 + 6, x2: x0 - 52, y2: y0 + 10, stroke: "#2b2723", "stroke-width": 3 }));
      svg.appendChild(E("line", { x1: x0 - 52, y1: y0 + 10, x2: x0 + 3 * cw, y2: y0 + 10, stroke: "#2b2723", "stroke-width": 3 }));
      svg.appendChild(E("line", { x1: x0 - 20, y1: y0 + rh, x2: x0 + 3 * cw, y2: y0 + rh, stroke: "#2b2723", "stroke-width": 2.5 }));
      String(q * c.d).padStart(3, " ").split("").forEach((ch, i) => { if (ch.trim()) svg.appendChild(T(x0 + i * cw + cw / 2, y0 + rh + 28, ch, { "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#c4622d", "font-family": "ui-monospace, monospace" })); });
      svg.appendChild(E("line", { x1: x0 - 20, y1: y0 + rh + 38, x2: x0 + 3 * cw, y2: y0 + rh + 38, stroke: "#2b2723", "stroke-width": 2 }));
      if (rem) svg.appendChild(T(x0 + 3 * cw + 16, y0 + rh + 36, "余 " + rem, { "font-size": 14, "font-weight": 700, fill: "#4a5b8c" }));
      vis.appendChild(svg);

      out.innerHTML =
        "<b>" + c.v + " ÷ " + c.d + " = " + q + (rem ? "…… " + rem : "") + "</b><br>" +
        "商是<strong>一位一位试出来</strong>的：<br>" +
        "① 商的<strong>个位</strong>在 " + lo + " 到 " + hi + " 之间（太小除不尽，太大就超了）<br>" +
        "② 逐个试：<b>" + q % 10 + " × " + c.d + " = " + (q % 10) * c.d + "</b>，不超过 " + c.v + " → 就取 " + (q % 10) + "<br>" +
        "③ <strong>乘一次验一验</strong>：" + q + " × " + c.d + " = " + (q * c.d) + "，" + (rem ? "余 " + rem + " < " + c.d + " ✓" : "正好除尽 ✓") + "<br>" +
        "<span style='color:#c4622d'><strong>除数是两位数也不需要新口诀</strong>——<br>用<strong>乘法口诀倒着查</strong>，找出最接近的商就行。</span>";
    }
    on("d2-sel", "input", go);
    go();
  }

  function boot() { orderDemo(); lawDemo(); decMulDemo(); bigMulDemo(); div2Demo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
