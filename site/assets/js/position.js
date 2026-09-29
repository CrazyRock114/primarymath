/* ==========================================================================
   position.js —— 位置与运动的图示（B8）
   ---------------------------------------------------------------------------
   核心主张：位置由「有序的两个坐标」确定 —— 数对 (列, 行)。
   这和位值制（数字站在哪一位）是同一个结构：位置 = 有序的索引。
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };

  /* ======================================================================
     ① 数对定位器 —— 拖动看 (列, 行) 怎么变
     ====================================================================== */
  function pairDemo() {
    const host = $("pd-demo"); if (!host) return;
    const vis = $("pd-vis"), out = $("pd-out");
    const col = $("pd-col"), row = $("pd-row");
    const colv = $("pd-colv"), rowv = $("pd-rowv");
    const MAXC = 8, MAXR = 6, CW = 44, CH = 38;

    function go() {
      const C = +col.value, R = +row.value;
      colv.textContent = C; rowv.textContent = R;
      vis.innerHTML = "";
      const W = 640, H = 300, x0 = 56, y0 = 30;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

      // 网格
      for (let i = 0; i <= MAXC; i++)
        svg.appendChild(E("line", { x1: x0 + i * CW, y1: y0, x2: x0 + i * CW, y2: y0 + MAXR * CH, stroke: "#e5ded2", "stroke-width": 1.5 }));
      for (let j = 0; j <= MAXR; j++)
        svg.appendChild(E("line", { x1: x0, y1: y0 + j * CH, x2: x0 + MAXC * CW, y2: y0 + j * CH, stroke: "#e5ded2", "stroke-width": 1.5 }));
      // 列号（横向）
      for (let i = 1; i <= MAXC; i++)
        svg.appendChild(T(x0 + (i - 0.5) * CW, y0 - 8, i, { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#4a5b8c" }));
      // 行号（纵向）
      for (let j = 1; j <= MAXR; j++)
        svg.appendChild(T(x0 - 14, y0 + (j - 0.5) * CH + 4, j, { "text-anchor": "end", "font-size": 12, "font-weight": 700, fill: "#c4622d" }));

      // 整列整行高亮
      svg.appendChild(E("rect", { x: x0 + (C - 1) * CW, y: y0, width: CW, height: MAXR * CH, fill: "#4a5b8c", opacity: .1 }));
      svg.appendChild(E("rect", { x: x0, y: y0 + (R - 1) * CH, width: MAXC * CW, height: CH, fill: "#c4622d", opacity: .1 }));

      // 标记点
      const px = x0 + (C - 0.5) * CW, py = y0 + (R - 0.5) * CH;
      svg.appendChild(E("circle", { cx: px, cy: py, r: 13, fill: "#c4622d", opacity: .3 }));
      svg.appendChild(E("circle", { cx: px, cy: py, r: 7, fill: "#c4622d" }));

      // 标注
      svg.appendChild(T(x0 + (MAXC / 2) * CW, y0 + MAXR * CH + 28, "列 →（左右）", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#4a5b8c" }));
      svg.appendChild(T(x0 - 40, y0 + (MAXR / 2) * CH, "行 →（上下）", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#c4622d", transform: `rotate(-90 ${x0 - 40} ${y0 + (MAXR / 2) * CH})` }));
      svg.appendChild(T(px + 20, py - 16, "●", { "font-size": 11, fill: "#c4622d" }));
      vis.appendChild(svg);

      out.innerHTML =
        "这个点的位置是 <b style='color:#4a5b8c;font-size:19px'>(" + C + ", " + R + ")</b><br>" +
        "读作：<b>第 " + C + " 列，第 " + R + " 行</b>。<br>" +
        "<span style='color:#c4622d'><strong>顺序不能颠倒</strong>——(3, 5) 和 (5, 3) 是<strong>两个不同的位置</strong>。<br>" +
        "而且<strong>列在前、行在后</strong>是规定死的，就像位值制里<strong>个位在右、十位在左</strong>一样——<strong>顺序固定，才能互相确认。</strong></span>";
    }
    on("pd-col", "input", go); on("pd-row", "input", go);
    go();
  }

  /* ======================================================================
     ② 两个网格 —— 数对锁的是「第几列第几行」，不是实际距离
     ====================================================================== */
  function twoGridDemo() {
    const host = $("tg-demo"); if (!host) return;
    const vis = $("tg-vis"), out = $("tg-out");
    const cell = $("tg-cell");
    const cellv = $("tg-cellv");

    function go() {
      const u = +cell.value;   // 格子大小 26-52
      cellv.textContent = u;
      const C = 3, R = 5, MAXC = 5, MAXR = 5;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 260", width: "100%" });

      const drawGrid = (ox, oy, cw, ch, title) => {
        for (let i = 0; i <= MAXC; i++)
          svg.appendChild(E("line", { x1: ox + i * cw, y1: oy, x2: ox + i * cw, y2: oy + MAXR * ch, stroke: "#e5ded2", "stroke-width": 1.5 }));
        for (let j = 0; j <= MAXR; j++)
          svg.appendChild(E("line", { x1: ox, y1: oy + j * ch, x2: ox + MAXC * cw, y2: oy + j * ch, stroke: "#e5ded2", "stroke-width": 1.5 }));
        for (let i = 1; i <= MAXC; i++)
          svg.appendChild(T(ox + (i - 0.5) * cw, oy - 8, i, { "text-anchor": "middle", "font-size": 11.5, "font-weight": 700, fill: "#4a5b8c" }));
        for (let j = 1; j <= MAXR; j++)
          svg.appendChild(T(ox - 12, oy + (j - 0.5) * ch + 4, j, { "text-anchor": "end", "font-size": 11.5, "font-weight": 700, fill: "#c4622d" }));
        svg.appendChild(T(ox + (MAXC / 2) * cw, oy + MAXR * ch + 26, title, { "text-anchor": "middle", "font-size": 12.5, "font-weight": 700, fill: "#5c554d" }));
        const px = ox + (C - 0.5) * cw, py = oy + (R - 0.5) * ch;
        svg.appendChild(E("rect", { x: ox + (C - 1) * cw, y: oy, width: cw, height: MAXR * ch, fill: "#4a5b8c", opacity: .1 }));
        svg.appendChild(E("rect", { x: ox, y: oy + (R - 1) * ch, width: MAXC * cw, height: ch, fill: "#c4622d", opacity: .1 }));
        svg.appendChild(E("circle", { cx: px, cy: py, r: 10, fill: "#c4622d", opacity: .3 }));
        svg.appendChild(E("circle", { cx: px, cy: py, r: 5.5, fill: "#c4622d" }));
      };
      drawGrid(70, 40, u, u * 0.85, "图 A（格子大）");
      drawGrid(70 + 5 * u + 70, 40, u * 0.55, u * 0.47, "图 B（格子小）");
      vis.appendChild(svg);

      out.innerHTML =
        "两张图上，<b>红点的位置都是 (" + C + ", " + R + ")</b>。<br>" +
        "但是——<b>红点离原点的实际距离完全不同</b>（格子大，图上远；格子小，图上近）。<br>" +
        "<span style='color:#c4622d'><strong>数对锁的是「第几列、第几行」，不是「离多远」。</strong><br>" +
        "这就像<strong>位值制里的「3」不表示它本身有多大，只表示它站在哪一位</strong>——<br>" +
        "「同一个数对」在不同尺度的图上，<strong>位置关系一样，绝对距离可以不同</strong>。</span>";
    }
    on("tg-cell", "input", go);
    go();
  }

  /* ======================================================================
     ③ 图形的运动 —— 平移 / 旋转 / 放大缩小，各自保持什么
     ====================================================================== */
  function moveDemo() {
    const host = $("mv-demo"); if (!host) return;
    const vis = $("mv-vis"), out = $("mv-out");
    const mode = $("mv-mode");
    const amt = $("mv-amt");
    const amtv = $("mv-amtv");

    const tri = [[0, 0], [90, 0], [0, 76]];
    function draw(ox, oy, tf, label, note) {
      const svg = E("svg", { viewBox: "0 0 0 0" });
      return null;
    }

    function go() {
      const m = mode.value, A = +amt.value;
      amtv.textContent = A;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 280", width: "100%" });

      const panels = {
        "0": { n: "平移", keep: "形状、大小、方向 全部不变", chg: "只有位置变了" },
        "1": { n: "旋转", keep: "形状、大小不变", chg: "方向变了" },
        "2": { n: "放大缩小", keep: "形状、方向不变", chg: "大小变了" },
        "3": { n: "轴对称", keep: "形状、大小不变", chg: "方向翻转了" },
      };
      const P = panels[m];

      // 原始图形
      const drawTri = (cx, cy, sc, rot, flip) => {
        const pts = tri.map(([x, y]) => {
          let p = [x - 45, y - 38];
          if (flip) p = [-p[0], p[1]];
          if (rot) {
            const r = rot * Math.PI / 180;
            p = [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
          }
          return [cx + p[0] * sc, cy + p[1] * sc];
        });
        svg.appendChild(E("polygon", { points: pts.map((p) => p.join(",")).join(" "), fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5 }));
      };

      // 左边：原图
      svg.appendChild(T(150, 30, "原图", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#8d857a" }));
      drawTri(150, 140, 1, 0, false);
      svg.appendChild(E("line", { x1: 150, y1: 60, x2: 150, y2: 220, stroke: "#cfc7ba", "stroke-width": 1, "stroke-dasharray": "4 3" }));
      svg.appendChild(E("line", { x1: 70, y1: 140, x2: 230, y2: 140, stroke: "#cfc7ba", "stroke-width": 1, "stroke-dasharray": "4 3" }));

      // 箭头
      svg.appendChild(T(300, 145, "→", { "text-anchor": "middle", "font-size": 30, fill: "#c4622d" }));
      svg.appendChild(T(300, 110, P.n, { "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: "#c4622d" }));
      svg.appendChild(T(300, 190, "拖动参数", { "text-anchor": "middle", "font-size": 11, fill: "#8d857a" }));

      // 右边：变换后
      svg.appendChild(T(480, 30, "变换后", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#8d857a" }));
      svg.appendChild(E("line", { x1: 480, y1: 60, x2: 480, y2: 220, stroke: "#cfc7ba", "stroke-width": 1, "stroke-dasharray": "4 3" }));
      svg.appendChild(E("line", { x1: 400, y1: 140, x2: 560, y2: 140, stroke: "#cfc7ba", "stroke-width": 1, "stroke-dasharray": "4 3" }));
      if (m === "0") {
        const d = A;
        svg.appendChild(E("line", { x1: 150, y1: 140, x2: 150 + d, y2: 140, stroke: "#c4622d", "stroke-width": 1.8, "marker-end": "" }));
        svg.appendChild(T(150 + d / 2, 132, "平移 " + d, { "text-anchor": "middle", "font-size": 11.5, fill: "#c4622d" }));
        drawTri(480 + d, 140, 1, 0, false);
      } else if (m === "1") {
        drawTri(480, 140, 1, A * 1.8, false);
        svg.appendChild(T(480, 235, "旋转 " + Math.round(A * 1.8) + "°", { "text-anchor": "middle", "font-size": 12, fill: "#c4622d" }));
      } else if (m === "2") {
        drawTri(480, 140, 0.7 + A / 100, 0, false);
        svg.appendChild(T(480, 235, "放大到 " + (0.7 + A / 100).toFixed(2) + " 倍", { "text-anchor": "middle", "font-size": 12, fill: "#c4622d" }));
      } else {
        // 对称轴必须是两图形的实际镜像线：两个三角形中心分别在 150 与 480+A，
        // 形状大小相同且左右翻转，镜像轴就是两者中点 (150 + 480 + A) / 2。
        // 原先写死 x=380，A=0 时真实轴在 315，图根本不关于所画轴对称。
        const axisX = (150 + (480 + A)) / 2;
        svg.appendChild(E("line", { x1: axisX, y1: 60, x2: axisX, y2: 220, stroke: "#c4622d", "stroke-width": 2, "stroke-dasharray": "6 4" }));
        svg.appendChild(T(axisX - 8, 54, "对称轴", { "text-anchor": "end", "font-size": 11.5, fill: "#c4622d" }));
        // 左右两端各连一条引导线，肉眼可验「到轴距离相等」
        svg.appendChild(E("line", { x1: 195, y1: 102, x2: 480 + A - 45, y2: 102, stroke: "#c4622d", "stroke-width": 1, "stroke-dasharray": "3 3", opacity: .6 }));
        drawTri(480 + A, 140, 1, 0, true);
      }
      vis.appendChild(svg);

      out.innerHTML = "<b>" + P.n + "</b><br>" +
        "🟢 <b>不变：</b>" + P.keep + "<br>" +
        "🟠 <b>改变：</b>" + P.chg + "<br>" +
        "<span style='color:#c4622d'><strong>判断一个变换，关键看「什么没变」——</strong><br>" +
        "没变的那部分<strong>保证它还是同一个图形</strong>，所以可以对应起来。<br>" +
        "这就是「<strong>图形的运动和数形结合</strong>」的核心：<strong>动起来，关系才看得见。</strong></span>";
    }
    on("mv-mode", "input", go); on("mv-amt", "input", go);
    go();
  }

  function boot() { pairDemo(); twoGridDemo(); moveDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
