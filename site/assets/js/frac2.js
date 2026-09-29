/* ==========================================================================
   frac2.js —— 分数四则运算图示
   ---------------------------------------------------------------------------
   核心主张（承接 B2/B3/B4 的同一条主线）：
     整数乘法 = 计数单位相乘
     小数乘法 = 计数单位相乘（0.1 × 0.1 = 0.01）
     分数乘法 = 计数单位相乘（1/2 × 1/3 = 1/6）    ← 同一件事的第三种样子
     分数除法 = 乘倒数 = 让「乘积不变」的单位换算
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };

  /* 画一条被分成 D 份的长条，取 N 份 */
  function bar(svg, x, y, w, h, D, N, color, op) {
    svg.appendChild(E("rect", { x, y, width: w, height: h, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 1.5 }));
    const bw = w / D;
    for (let i = 0; i < N; i++)
      svg.appendChild(E("rect", { x: x + i * bw, y, width: bw, height: h, fill: color, opacity: op == null ? .75 : op }));
    for (let i = 1; i < D; i++)
      svg.appendChild(E("line", { x1: x + i * bw, y1: y, x2: x + i * bw, y2: y + h, stroke: "#fff", "stroke-width": 1.2 }));
  }

  /* ======================================================================
     ① 分数乘法 —— 面积模型：a/b × c/d 的含义
     ====================================================================== */
  function fracMulDemo() {
    const host = $("fm-demo"); if (!host) return;
    const vis = $("fm-vis"), out = $("fm-out");
    const mode = $("fm-mode");

    function go() {
      const a = 2, b = 3, c = 3, d = 4;   // 2/3 × 3/4
      vis.innerHTML = "";
      const W = 640, H = 250;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const x0 = 40, totalW = 380;
      // 横条：先分成 b 份
      svg.appendChild(T(x0, 24, "第 1 步：把整体平均分成 " + b + " 份，取 " + a + " 份（横条）", { "font-size": 12.5, fill: "#5c554d" }));
      bar(svg, x0, 34, totalW, 40, b, a, "#6aa287");
      // 纵条：再分成 d 份
      const vx = x0 + totalW + 40;
      svg.appendChild(T(vx, 24, "第 2 步：每一份再分成 " + d + " 份，取 " + c + " 份（竖条）", { "font-size": 12.5, fill: "#5c554d" }));
      svg.appendChild(E("rect", { x: vx, y: 34, width: 40, height: 40 * d / b, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 1.5 }));
      // 网格：b 行 d 列
      const cellW = 40, cellH = 40 / b;
      for (let r = 0; r < b; r++)
        for (let cI = 0; cI < d; cI++) {
          const filled = r < a && cI < c;
          svg.appendChild(E("rect", {
            x: vx + cI * cellW, y: 34 + r * cellH, width: cellW, height: cellH,
            fill: filled ? "#c4622d" : "#f3efe7", opacity: filled ? .7 : 1,
            stroke: filled ? "#fff" : "#e5ded2", "stroke-width": 1,
          }));
        }
      // 结果
      svg.appendChild(T(x0, 120, "第 3 步：取出来的格子，占整体的", { "font-size": 12.5, fill: "#5c554d" }));
      svg.appendChild(T(x0, 142, (a * c) + " / " + (b * d), { "font-size": 26, "font-weight": 700, fill: "#c4622d", "font-family": "ui-monospace, monospace" }));
      svg.appendChild(T(x0 + 120, 142, "= " + a + "/" + b + " × " + c + "/" + d + " = " + (a * c) + "/" + (b * d) + " = " + ((a * c) / (b * d)).toFixed(4), { "font-size": 15, fill: "#2b2723" }));
      // 结论
      const y = 180;
      const note = mode.value === "1"
        ? "分母 <b>" + b + " × " + d + " = " + (b * d) + "</b>：先分成 3 份，每份再分成 4 份 → <b>一共 12 个小格子</b>。<br>分子 <b>" + a + " × " + c + " = " + (a * c) + "</b>：横着取 2 行，每行取 3 列 → <b>" + (a * c) + " 个</b>。"
        : "先看图：整体被切成 <b>" + (b * d) + "</b> 个小格（3 行 × 4 列），取到 <b>" + (a * c) + "</b> 个。<br>所以 <b>" + a + "/" + b + " × " + c + "/" + d + " = " + (a * c) + "/" + (b * d) + "</b>。<br><span style='color:#c4622d'><strong>分子乘分子，分母乘分母</strong>——不是背的，是<strong>数格子数出来的</strong>。</span>";
      vis.appendChild(svg);
      out.innerHTML = "<b>" + a + "/" + b + " × " + c + "/" + d + " = " + (a * c) + "/" + (b * d) + "</b><br>" + note;
    }
    on("fm-mode", "input", go);
    go();
  }

  /* ======================================================================
     ② 分数除法 —— 为什么是乘倒数（最关键）
     ====================================================================== */
  function fracDivDemo() {
    const host = $("fd-demo"); if (!host) return;
    const vis = $("fd-vis"), out = $("fd-out");
    const mode = $("fd-mode");
    // 3/4 ÷ 1/2
    const a = 3, b = 4, c = 1, d = 2;
    const comm = 8;                       // 通分到 8
    const q = (a * d) / (b * c);          // 3/4 ÷ 1/2 = 1.5

    function go() {
      vis.innerHTML = "";
      const W = 640, H = 236;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const x0 = 40, bw = 360;
      if (mode.value === "0") {
        // 意义：3/4 里有几个 1/2
        svg.appendChild(T(x0, 24, "第 1 步：3/4 是被谁装出来的？", { "font-size": 12.5, fill: "#5c554d" }));
        svg.appendChild(T(x0, 44, "3/4 = " + a + "/" + b + " = " + a + " 个 1/" + b, { "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(x0, 76, "1/2 = " + c + "/" + d + " = " + c + " 个 1/" + d, { "font-size": 14, "font-weight": 700, fill: "#4a5b8c" }));
        svg.appendChild(T(x0, 104, "单位不一样，不能直接数。换算成 1/" + comm + "：", { "font-size": 12.5, fill: "#5c554d" }));
        bar(svg, x0, 114, bw, 44, comm, a * d, "#6aa287");
        svg.appendChild(T(x0, 176, "3/4 = " + (a * d) + "/" + comm, { "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(x0, 200, "1/2 = " + (c * (comm / d)) + "/" + comm + " = " + (c * (comm / d)) + "/" + comm + " = " + (c * (comm / d)) + " 格", { "font-size": 13, "font-weight": 700, fill: "#4a5b8c" }));
        svg.appendChild(T(x0, 226, "问：这里装着 几个 1/2 ？→ " + (a * d) + " ÷ " + (c * (comm / d)) + " = <b>" + q + "</b>", { "font-size": 14, fill: "#c4622d" }));
      } else {
        // 验算：为什么乘倒数
        svg.appendChild(T(x0, 26, "用乘法验算： " + q + " × 1/2 = 0.75 = 3/4 ✓", { "font-size": 14, fill: "#2f6b52" }));
        svg.appendChild(T(x0, 58, "那 3/4 × ? = 3/4 —— 问号该填几？", { "font-size": 13.5, fill: "#5c554d" }));
        svg.appendChild(T(x0, 86, "要让「原来的 3/4」保持不变，", { "font-size": 13.5, fill: "#5c554d" }));
        svg.appendChild(T(x0, 112, "多乘的 " + c + "/" + d + " 就必须被 除以同样的 " + c + "/" + d + " 抵消掉", { "font-size": 13.5, fill: "#c4622d" }));
        svg.appendChild(T(x0, 142, "除以 " + c + "/" + d + " = 乘 1 ÷ " + c + "/" + d + " = 乘 " + d + "/" + c + "（倒数）", { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(x0, 176, "所以  " + a + "/" + b + " ÷ " + c + "/" + d + " = " + a + "/" + b + " × <b>" + d + "/" + c + "</b>", { "font-size": 16, "font-weight": 700, fill: "#2b2723" }));
        svg.appendChild(T(x0, 206, "= " + (a * d) + "/" + (b * c) + " = <b>" + ((a * d) / (b * c)).toFixed(4) + "</b>  （换算成带分数 = 1 又 " + (((a * d) % (b * c)) / (b * c)).toFixed(4) + "）", { "font-size": 13.5, fill: "#5c554d" }));
      }
      vis.appendChild(svg);

      out.innerHTML = mode.value === "0"
        ? "<b>分数除法的意义：<em class='hl'>「几份里有几份」</em></b><br>不是「平均分成几份」，是「<strong>装了几个</strong>」。所以<strong>通分后要除，而不是乘</strong>。"
        : "<b>为什么除以一个数 = 乘它的倒数？</b><br>" +
          "<span style='color:#c4622d'><strong>因为要保持「乘积不变」</strong>——和 B4 小数除法「把两个数同时换成更大单位，商不变」<strong>是同一条规则</strong>。<br>" +
          "分母从 2 变成 4（变大了），要让商不变，分子就得从 3 变成 6（也变大）——<strong>而「从 1/2 变成 2」正是乘 2</strong>。</span>";
    }
    on("fd-mode", "input", go);
    go();
  }

  /* ======================================================================
     ③ 异分母分数加减 —— 通分之后为什么就能加减
     ====================================================================== */
  function fracAddDemo() {
    const host = $("fa-demo"); if (!host) return;
    const vis = $("fa-vis"), out = $("fa-out");
    const mode = $("fa-mode");
    // 1/2 + 1/3
    const A = 1, B = 2, C = 1, D = 3, comm = 6;

    function go() {
      vis.innerHTML = "";
      const W = 640, H = 222;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const x0 = 40, bw = 300;
      if (mode.value === "0") {
        svg.appendChild(T(x0, 24, "没通分：单位不同", { "font-size": 13, "font-weight": 700, fill: "#c4622d" }));
        bar(svg, x0, 34, bw, 40, B, A, "#6aa287");
        svg.appendChild(T(x0 + bw + 14, 60, "+", { "font-size": 20, "font-weight": 700 }));
        bar(svg, x0 + bw + 50, 34, bw, 40, D, C, "#4a5b8c");
        svg.appendChild(T(x0, 100, "1/2 是「二分之一」，1/3 是「三分之一」", { "font-size": 13.5, fill: "#5c554d" }));
        svg.appendChild(T(x0, 124, "<b>单位不同，不能合并</b>——就像 2 个苹果 + 2 只猫。", { "font-size": 14, fill: "#c4622d" }));
        svg.appendChild(T(x0, 158, "而且 1/2 和 1/3 连「大小一样」都很难比。", { "font-size": 13, fill: "#8d857a" }));
      } else {
        svg.appendChild(T(x0, 24, "通分之后：单位相同", { "font-size": 13, "font-weight": 700, fill: "#2f6b52" }));
        bar(svg, x0, 34, bw, 40, comm, A * (comm / B), "#6aa287");
        svg.appendChild(T(x0 + bw + 14, 60, "+", { "font-size": 20, "font-weight": 700 }));
        bar(svg, x0 + bw + 50, 34, bw, 40, comm, C * (comm / D), "#4a5b8c");
        svg.appendChild(T(x0, 100, "1/2 = " + (A * (comm / B)) + "/" + comm + "　　1/3 = " + (C * (comm / D)) + "/" + comm, { "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(x0, 128, "两个都是「" + comm + " 分之一」，可以<strong>直接合并</strong>：", { "font-size": 13.5, fill: "#5c554d" }));
        bar(svg, x0, 140, bw, 40, comm, A * (comm / B) + C * (comm / D), "#c4622d");
        svg.appendChild(T(x0, 202, "=" + (A * (comm / B) + C * (comm / D)) + "/" + comm + " = <b>" + ((A * (comm / B) + C * (comm / D)) / comm).toFixed(4) + "</b>　（= " + (A * (comm / B)) + "/" + comm + " + " + (C * (comm / D)) + "/" + comm + "）", { "font-size": 14, fill: "#2b2723" }));
      }
      vis.appendChild(svg);
      out.innerHTML = mode.value === "0"
        ? "<b>1/2 + 1/3 不能直接算。</b><br><span style='color:#c4622d'>单位不同就是不能加</span>——和 B4 的小数点对齐、整数末位对齐是<strong>同一条规则</strong>。</span>"
        : "<b>1/2 + 1/3 = " + ((A * (comm / B) + C * (comm / D)) / comm).toFixed(4) + "</b><br>" +
          "通分之后<strong>单位统一了</strong>，就能像整数一样合并。<br>" +
          "<span style='color:#c4622d'><strong>通分不是技巧，是换单位</strong>——理由和为什么必须通分一样。</span>";
    }
    on("fa-mode", "input", go);
    go();
  }

  /* ======================================================================
     ④ 比例 —— 三个量里两个不变，第三个跟着变
     ====================================================================== */
  function ratioDemo() {
    const host = $("rt-demo"); if (!host) return;
    const vis = $("rt-vis"), out = $("rt-out");
    const q = $("rt-q");

    function go() {
      const Q = +q.value;   // 每份的数量
      vis.innerHTML = "";
      const W = 640, H = 190;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      // 份数表
      const rows = 6, cw = 62, ch = 24, x0 = 40, y0 = 34;
      for (let r = 0; r < rows; r++) {
        svg.appendChild(T(x0 - 12, y0 + r * ch + 17, r + 1 + " 份", { "text-anchor": "end", "font-size": 12, fill: "#5c554d" }));
        const cnt = (r + 1) * Q;
        svg.appendChild(E("rect", { x: x0, y: y0 + r * ch, width: cw, height: ch - 4, fill: "#f3efe7", stroke: "#cfc7ba" }));
        svg.appendChild(T(x0 + cw / 2, y0 + r * ch + 16, cnt, { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#2b2723", "font-family": "ui-monospace, monospace" }));
      }
      svg.appendChild(T(x0 + cw + 20, 60, "每份 " + Q, { "font-size": 13, fill: "#5c554d" }));
      // 两条线
      const lx = 320, lx2 = 470;
      svg.appendChild(T(lx, 30, "比值", { "font-size": 12, fill: "#8d857a" }));
      svg.appendChild(T(lx, 56, "3 份 : " + (3 * Q) + " 个", { "font-size": 16, "font-weight": 700, fill: "#2f6b52" }));
      svg.appendChild(T(lx, 80, "6 份 : " + (6 * Q) + " 个", { "font-size": 16, "font-weight": 700, fill: "#2f6b52" }));
      svg.appendChild(T(lx, 104, "9 份 : " + (9 * Q) + " 个", { "font-size": 16, "font-weight": 700, fill: "#2f6b52" }));
      svg.appendChild(T(lx2, 30, "实际", { "font-size": 12, fill: "#8d857a" }));
      svg.appendChild(T(lx2, 56, "3 份 = " + (3 * Q), { "font-size": 15, "font-weight": 700, fill: "#c4622d" }));
      svg.appendChild(T(lx2, 80, "6 份 = " + (6 * Q), { "font-size": 15, "font-weight": 700, fill: "#c4622d" }));
      svg.appendChild(T(lx2, 104, "9 份 = " + (9 * Q), { "font-size": 15, "font-weight": 700, fill: "#c4622d" }));
      vis.appendChild(svg);

      const a = 3, b = 6, c = 9;
      out.innerHTML =
        "<b>" + a + " : " + (a * Q) + " = " + b + " : " + (b * Q) + " = " + c + " : " + (c * Q) + "</b><br>" +
        "这三个比<strong>都等于同一个数</strong>：<b>" + (1 / Q).toFixed(4) + "</b>。<br>" +
        "换句话说：<strong>份数变了，每份的数量按同样比例跟着变</strong>，<strong>比值不变</strong>。<br>" +
        "<span style='color:#c4622d'><strong>比例的本质是「两个量一起变，但关系不变」。</strong><br>" +
        "所以「比例尺」「按比例分配」不是新东西，就是<strong>同一种关系</strong>。</span>";
    }
    on("rt-q", "input", go);
    go();
  }

  function boot() { fracMulDemo(); fracDivDemo(); fracAddDemo(); ratioDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
