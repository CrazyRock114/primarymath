/* ==========================================================================
   measure.js —— 图形的测量图示（B7）
   ---------------------------------------------------------------------------
   核心主张：所有面积/表面积公式，都从「数格子」这一个动作推出来。
     组合图形 → 分割或添补 → 化归成已学过的图形
     梯形     → 剪一刀 → 拼成平行四边形的一半
     长方体   → 展开 → 6 个长方形
     圆柱     → 展开 → 1 个长方形 + 2 个圆
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };

  /* ======================================================================
     ① 组合图形 —— 分割法 / 添补法
     L 形：8×5 的长方形缺掉 3×2
     ====================================================================== */
  function comboDemo() {
    const host = $("cb-demo"); if (!host) return;
    const vis = $("cb-vis"), out = $("cb-out");
    const mode = $("cb-mode");
    const W8 = 8, H5 = 5, cutW = 3, cutH = 2, unit = 44;
    const total = W8 * H5 - cutW * cutH;

    function go() {
      const m = mode.value;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 300", width: "100%" });
      const x0 = 50, y0 = 40;
      const pts = [[x0, y0], [x0 + W8 * unit, y0], [x0 + W8 * unit, y0 + (H5 - cutH) * unit],
        [x0 + (W8 - cutW) * unit, y0 + (H5 - cutH) * unit], [x0 + (W8 - cutW) * unit, y0 + H5 * unit], [x0, y0 + H5 * unit]];
      svg.appendChild(E("polygon", { points: pts.map((p) => p.join(",")).join(" "), fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5 }));

      if (m === "0") {
        // 分割法：沿缺角对角切开，分成两个长方形
        const sx = x0 + (W8 - cutW) * unit, sy = y0 + (H5 - cutH) * unit;
        svg.appendChild(E("line", { x1: x0 + W8 * unit, y1: sy, x2: sx, y2: y0 + H5 * unit, stroke: "#c4622d", "stroke-width": 2.5, "stroke-dasharray": "6 4" }));
        svg.appendChild(T(x0 + W8 * unit + 10, sy - 6, "切一刀", { "font-size": 12.5, "font-weight": 700, fill: "#c4622d" }));
        svg.appendChild(T(x0 + 40, y0 + H5 * unit + 26, "① 大长方形：" + W8 + " × " + (H5 - cutH) + " = " + (W8 * (H5 - cutH)), { "font-size": 14, fill: "#2b2723" }));
        svg.appendChild(T(x0 + 40, y0 + H5 * unit + 48, "② 小长方形：" + (W8 - cutW) + " × " + cutH + " = " + ((W8 - cutW) * cutH), { "font-size": 14, fill: "#2b2723" }));
      } else if (m === "1") {
        // 添补法：补成大长方形，再减掉缺角
        svg.appendChild(E("rect", { x: x0, y: y0, width: W8 * unit, height: H5 * unit, fill: "none", stroke: "#cfc7ba", "stroke-width": 2, "stroke-dasharray": "5 4" }));
        const c = [[x0 + (W8 - cutW) * unit, y0 + (H5 - cutH) * unit], [x0 + W8 * unit, y0 + (H5 - cutH) * unit], [x0 + W8 * unit, y0 + H5 * unit], [x0 + (W8 - cutW) * unit, y0 + H5 * unit]];
        svg.appendChild(E("polygon", { points: c.map((p) => p.join(",")).join(" "), fill: "#f3efe7", stroke: "#c4622d", "stroke-width": 2, opacity: .9 }));
        svg.appendChild(T(x0 + W8 * unit + 10, y0 + (H5 - cutH) * unit + 18, "补满的缺角", { "font-size": 12, fill: "#c4622d" }));
        svg.appendChild(T(x0 + 40, y0 + H5 * unit + 26, "整个：" + W8 + " × " + H5 + " = " + (W8 * H5), { "font-size": 14, fill: "#2b2723" }));
        svg.appendChild(T(x0 + 40, y0 + H5 * unit + 48, "减去缺角：" + cutW + " × " + cutH + " = " + (cutW * cutH), { "font-size": 14, fill: "#c4622d" }));
      } else {
        // 数格子
        for (let r = 0; r < H5; r++)
          for (let cI = 0; cI < W8; cI++) {
            const inShape = !(cI >= W8 - cutW && r >= H5 - cutH);
            svg.appendChild(E("rect", {
              x: x0 + cI * unit, y: y0 + r * unit, width: unit - 2, height: unit - 2,
              fill: inShape ? "#2f6b52" : "#f3efe7", opacity: inShape ? .55 : 1,
            }));
          }
        svg.appendChild(T(x0, y0 + H5 * unit + 28, "数一数深色格子有几个 —— " + total + " 个，面积就是 " + total, { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));
      }
      vis.appendChild(svg);

      out.innerHTML = m === "0"
        ? "<b>分割法：切成两块，分别算，再加。</b><br>" + W8 + "×" + (H5 - cutH) + " = " + (W8 * (H5 - cutH)) +
          "，加上 " + (W8 - cutW) + "×" + cutH + " = " + ((W8 - cutW) * cutH) + " → <b>总面积 " + total + "</b><br>" +
          "<span style='color:#c4622d'><strong>「切」——把不会的变成会的。</strong></span>"
        : m === "1"
          ? "<b>添补法：补成大的，再减掉多的。</b><br>" + W8 + "×" + H5 + " = " + (W8 * H5) +
            "，减去 " + cutW + "×" + cutH + " = " + (cutW * cutH) + " → <b>总面积 " + total + "</b><br>" +
            "<span style='color:#c4622d'><strong>切不动的时候，就补。</strong>两种方法殊途同归，选<strong>容易算的那条</strong>。</span>"
          : "<b>数格子是面积的原始定义。</b><br>公式只是「数格子的快捷方式」。<br>" +
            "<span style='color:#c4622d'><strong>不知道公式时，回到数格子——这是最可靠的兜底。</strong></span>";
    }
    on("cb-mode", "input", go);
    go();
  }

  /* ======================================================================
     ② 梯形 —— 剪一刀，拼成平行四边形的一半
     ====================================================================== */
  function trapDemo() {
    const host = $("tp-demo"); if (!host) return;
    const vis = $("tp-vis"), out = $("tp-out");
    const mode = $("tp-mode");
    const b1 = 8, b2 = 4, h = 5, unit = 34;   // 下底 8，上底 4，高 5

    function go() {
      const m = mode.value;
      vis.innerHTML = "";
      const W = 640, H = 280;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const cx = 200, yTop = 40, yBot = yTop + h * unit;
      const halfW = (b1 - b2) / 2 * unit;
      const xL = cx - b1 / 2 * unit, xR = cx + b1 / 2 * unit;
      const xLt = cx - b2 / 2 * unit, xRt = cx + b2 / 2 * unit;
      const poly = [[xL, yBot], [xR, yBot], [xRt, yTop], [xLt, yTop]];
      svg.appendChild(E("polygon", { points: poly.map((p) => p.join(",")).join(" "), fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5 }));

      if (m === "0") {
        // 标出两个高
        svg.appendChild(E("line", { x1: xL, y1: yBot, x2: xL, y2: yTop, stroke: "#c4622d", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
        svg.appendChild(E("line", { x1: xR, y1: yBot, x2: xR, y2: yTop, stroke: "#c4622d", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
        svg.appendChild(T(cx - 10, yTop + 6, "上底 " + b2, { "font-size": 12.5, fill: "#5c554d" }));
        svg.appendChild(T(cx, yBot + 20, "下底 " + b1, { "text-anchor": "middle", "font-size": 12.5, fill: "#5c554d" }));
        svg.appendChild(T(xR + 8, (yTop + yBot) / 2, "高 " + h, { "font-size": 12.5, fill: "#c4622d" }));
      } else {
        // 复制一个，拼成平行四边形
        svg.appendChild(E("polygon", {
          points: [[xR, yBot], [xR + b1 * unit, yBot], [xRt + b1 * unit, yTop], [xR, yTop]].map((p) => p.join(",")).join(" "),
          fill: "#f3efe7", stroke: "#6aa287", "stroke-width": 2, opacity: .85,
        }));
        svg.appendChild(E("line", { x1: xR, y1: yBot, x2: xR, y2: yTop, stroke: "#c4622d", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
        svg.appendChild(T(xR + 6, yBot - 10, "← 复制一个", { "font-size": 12, fill: "#6aa287", "font-weight": 600 }));
        svg.appendChild(T(cx, yBot + 46, "拼成平行四边形：底 = " + b1 + " + " + b2 + " = " + (b1 + b2), { "text-anchor": "middle", "font-size": 13.5, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(xL - 14, (yTop + yBot) / 2, "h", { "font-size": 13, fill: "#c4622d", "font-weight": 700 }));
      }
      vis.appendChild(svg);

      const area = (b1 + b2) * h / 2;
      out.innerHTML = m === "0"
        ? "<b>梯形的四个要素：上底、下底、腰、高。</b><br>腰是斜的，<strong>不能用腰算面积</strong>——底和高才决定面积。<br>" +
          "<span style='color:#c4622d'><strong>斜边是「干扰项」</strong>，跟面积无关。</span>"
        : "<b>梯形面积 = (上底 + 下底) × 高 ÷ 2 = (" + b1 + " + " + b2 + ") × " + h + " ÷ 2 = " + area + "</b><br>" +
          "两个完全一样的梯形，<strong>沿腰剪开、错位一拼，就成了平行四边形</strong>。<br>" +
          "平行四边形面积 = <b>(" + b1 + "+" + b2 + ") × " + h + " = " + ((b1 + b2) * h) + "</b>，<strong>是梯形的 2 倍</strong>，所以要 ÷2。<br>" +
          "<span style='color:#c4622d'><strong>÷2 不是规定，是「我用了两个梯形拼的，得还回去一半」。</strong></span>";
    }
    on("tp-mode", "input", go);
    go();
  }

  /* ======================================================================
     ③ 长方体/正方体 —— 展开图：表面积 = 6 个面的和
     ====================================================================== */
  function boxDemo() {
    const host = $("bx-demo"); if (!host) return;
    const vis = $("bx-vis"), out = $("bx-out");
    const a = $("bx-a"), b = $("bx-b"), c = $("bx-c");
    const av = $("bx-av"), bv = $("bx-bv"), cv = $("bx-cv");

    function go() {
      const A = +a.value, B = +b.value, C = +c.value;
      av.textContent = A; bv.textContent = B; cv.textContent = C;
      const u = 20, GAP = 3;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 260", width: "100%" });
      const faces = [
        { w: A, h: C, x: 0, y: 0, lab: "前", c: "#6aa287" },
        { w: B, h: C, x: (A + GAP) * u, y: 0, lab: "右", c: "#2f6b52" },
        { w: A, h: B, x: 0, y: (C + GAP) * u, lab: "下", c: "#4a5b8c" },
        { w: B, h: C, x: 0, y: (C + B + 2 * GAP) * u, lab: "后", c: "#8a5a2b" },
        { w: A, h: C, x: 0, y: (C + B + 2 * C + 3 * GAP) * u, lab: "上", c: "#a0492f" },
        { w: B, h: A, x: (A + GAP) * u, y: (C + GAP) * u, lab: "左", c: "#6b4a7a" },
      ];
      faces.forEach((f) => {
        svg.appendChild(E("rect", {
          x: 60 + f.x * u, y: 20 + f.y * u, width: f.w * u, height: f.h * u,
          fill: f.c, opacity: .35, stroke: f.c, "stroke-width": 2,
        }));
        svg.appendChild(T(60 + f.x * u + f.w * u / 2, 20 + f.y * u + f.h * u / 2, f.lab, { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: f.c }));
        svg.appendChild(T(60 + f.x * u + f.w * u / 2, 20 + f.y * u + f.h * u / 2 + 15, f.w + "×" + f.h, { "text-anchor": "middle", "font-size": 11, fill: "#5c554d" }));
      });
      // viewBox 必须按实际展开范围计算：原先固定 260 高，
      // 「上」「后」两面落在 y=360 以上，6 个面只有第 1 排可见。
      // 先量出包围盒，再重设 viewBox（SVG 宽度自适应，高度随之等比缩放）。
      const maxX = Math.max(...faces.map((f) => (f.x + f.w) * u)) + 60 + 30;
      const maxY = Math.max(...faces.map((f) => (f.y + f.h) * u)) + 20 + 30;
      svg.setAttribute("viewBox", "0 0 " + maxX + " " + maxY);
      vis.appendChild(svg);

      const S = 2 * (A * B + A * C + B * C);
      const V = A * B * C;
      const isCube = A === B && B === C;
      out.innerHTML =
        "<b>" + (isCube ? "正方体" : "长方体") + " " + A + "×" + B + "×" + C + "</b><br>" +
        "<b>表面积</b> = " + A + "×" + B + "×2 + " + A + "×" + C + "×2 + " + B + "×" + C + "×2 = <b>" + S + "</b><br>" +
        "<b>体积</b> = " + A + "×" + B + "×" + C + " = <b>" + V + "</b><br>" +
        "<span style='color:#c4622d'><strong>「表面积」是 6 个面加起来（展开图就是 6 块），<br>" +
        "「体积」是「底面积 × 高」——它算的是<strong>装东西的容量</strong>，不是皮。</strong><br>" +
        "算的时候先问一句：<strong>我要的是「包了多少纸」还是「能装多少水」？</strong></span>";
    }
    [a, b, c].forEach((e) => on(e.id, "input", go));
    go();
  }

  /* ======================================================================
     ④ 圆柱/圆锥 —— 展开图：长方形 + 2 个圆
     ====================================================================== */
  function cylDemo() {
    const host = $("cy-demo"); if (!host) return;
    const vis = $("cy-vis"), out = $("cy-out");
    const r = $("cy-r"), h = $("cy-h");
    const mode = $("cy-mode");

    function go() {
      const R = +r.value, H = +h.value;
      const m = mode.value;
      const circ = 2 * Math.PI * R, SB = Math.PI * R * R, V = SB * H;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 250", width: "100%" });
      const u = 16, x0 = 60, yTop = 40;

      // 侧面长方形
      const rectW = circ * u, rectH = H * u;
      svg.appendChild(E("rect", { x: x0, y: yTop, width: rectW, height: rectH, fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5 }));
      svg.appendChild(T(x0 + rectW / 2, yTop - 10, "侧面积 = 底面周长 × 高 = " + circ.toFixed(2) + " × " + H, { "text-anchor": "middle", "font-size": 12.5, "font-weight": 600, fill: "#2f6b52" }));
      // 两个底面圆
      const cxr = Math.min(x0 + rectW + 70, 560);
      [yTop + rectH / 2 - 42, yTop + rectH / 2 + 42].forEach((cy2, i) => {
        svg.appendChild(E("circle", { cx: cxr, cy: cy2, r: R * u, fill: "#f3efe7", stroke: "#c4622d", "stroke-width": 2.5 }));
        svg.appendChild(T(cxr, cy2 + 4, "底面 πr²", { "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: "#c4622d" }));
      });
      svg.appendChild(T(cxr, yTop + rectH / 2 + 68, "× 2 个", { "text-anchor": "middle", "font-size": 11.5, fill: "#c4622d" }));
      if (m === "1") {
        svg.appendChild(T(x0 + rectW / 2, yTop + rectH + 26, "圆柱：展开 = 1 个长方形 + 2 个圆", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#2b2723" }));
        svg.appendChild(T(x0 + rectW / 2, yTop + rectH + 46, "圆锥：侧面展开是<tspan/>扇形（小学不求面积）", { "text-anchor": "middle", "font-size": 12, fill: "#8d857a" }));
      }
      vis.appendChild(svg);

      out.innerHTML = m === "1"
        ? "<b>圆柱表面积 = 侧面积 + 2 个底面</b><br>" +
          "= <b>2πrh</b> + <b>2πr²</b> = " + (circ * H).toFixed(2) + " + " + (2 * SB).toFixed(2) + " = <b>" + (circ * H + 2 * SB).toFixed(2) + "</b><br>" +
          "<b>圆锥</b>：只有 1 个底面，侧面展开是<strong>扇形</strong>，小学<strong>不要求它的侧面积</strong>。<br>" +
          "<span style='color:#c4622d'><strong>最常见的错：圆柱的底面算成 1 个（忘了上下都有）。</strong></span>"
        : "<b>圆柱的「侧面积」= 底面周长 × 高 = " + circ.toFixed(2) + " × " + H + " = " + (circ * H).toFixed(2) + "</b><br>" +
          "<b>底面积</b> = πr² = " + SB.toFixed(2) + "　<b>体积</b> = 底面积 × 高 = <b>" + V.toFixed(2) + "</b><br>" +
          "<span style='color:#c4622d'><strong>「底面周长 × 高」不是规定</strong>——<br>" +
          "把圆柱的侧面<strong>剪开摊平</strong>，正好是一个长方形，长 = 底面周长，宽 = 高。<br>" +
          "<strong>所有立体表面积公式，都是「展开图 + 平面面积」的结果。</strong></span>";
    }
    [r, h, mode].forEach((e) => on(e.id, "input", go));
    go();
  }

  function boot() { comboDemo(); trapDemo(); boxDemo(); cylDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
