/* ==========================================================================
   geometry.js —— 图形的认识图示（B6）
   ---------------------------------------------------------------------------
   核心主张：孩子把「图形的性质」当成「一段线/一个图形」来记。
   所以每个图示都让孩子亲手改变图形，看见性质怎么变。
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };
  const R2 = (x) => Math.round(x * 100) / 100;

  /* ======================================================================
     ① 角 —— 它是「旋转了多少」，不是「两条线的交点」
     ====================================================================== */
  function angleDemo() {
    const host = $("ag-demo"); if (!host) return;
    const vis = $("ag-vis"), out = $("ag-out");
    const r = $("ag-r"), rv = $("ag-rv");
    const type = $("ag-type");

    function go() {
      const deg = +r.value;
      rv.textContent = deg + "°";
      const kind = type.value;
      let name, desc;
      if (kind === "0") {
        name = deg < 90 ? "锐角" : deg === 90 ? "直角" : deg < 180 ? "钝角" : "平角";
        desc = name + "（" + deg + "°）";
      } else if (kind === "1") {
        name = deg < 90 ? "锐角" : deg < 180 ? "钝角" : "平角";
        desc = "角的大小和两条边的<strong>长短无关</strong>——<strong>边再长，角也不变</strong>";
      } else {
        name = "角的两条边";
        desc = "角只有 <strong>2 条边</strong>和 <strong>1 个顶点</strong>。<strong>边越长角越大</strong>是错的。";
      }

      vis.innerHTML = "";
      const W = 640, H = 250, cx = 200, cy = 160, L = 150;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

      if (kind === "1") {
        // 边长可变，角不变
        [80, 150, 220].forEach((len, i) => {
          const g = 60 + i * 190;
          const a = -deg * Math.PI / 180;
          const p2 = [g + len, 170], p3 = [g + len * Math.cos(a), 170 + len * Math.sin(a)];
          svg.appendChild(E("line", { x1: p2[0], y1: p2[1], x2: p3[0], y2: p3[1], stroke: "#2f6b52", "stroke-width": 3, "stroke-linecap": "round" }));
          svg.appendChild(E("circle", { cx: p2[0], cy: p2[1], r: 3.5, fill: "#2b2723" }));
          svg.appendChild(E("path", { d: `M${p2[0] + 34} ${p2[1]} A34 34 0 0 1 ${p2[0] + 34 * Math.cos(a)} ${p2[1] + 34 * Math.sin(a)}`, fill: "none", stroke: "#c4622d", "stroke-width": 1.8 }));
          svg.appendChild(T(p2[0] - 4, 200, "边长 " + len, { "font-size": 12, fill: "#8d857a" }));
          svg.appendChild(T(p2[0] + 40, 200, deg + "°", { "font-size": 13, "font-weight": 700, fill: "#c4622d" }));
        });
      } else if (kind === "2") {
        // 角是旋转量
        const a0 = -deg * Math.PI / 180;
        svg.appendChild(E("line", { x1: cx, y1: cy, x2: cx + L, y2: cy, stroke: "#2f6b52", "stroke-width": 3, "stroke-linecap": "round" }));
        const ex = cx + L * Math.cos(a0), ey = cy + L * Math.sin(a0);
        svg.appendChild(E("line", { x1: cx, y1: cy, x2: ex, y2: ey, stroke: "#2f6b52", "stroke-width": 3, "stroke-linecap": "round" }));
        svg.appendChild(E("circle", { cx, cy, r: 4, fill: "#2b2723" }));
        // 旋转箭头
        const R2_ = 62;
        const steps = Math.max(1, Math.round(deg / 12));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const a = -(deg * i / steps) * Math.PI / 180;
          pts.push((cx + R2_ * Math.cos(a)).toFixed(1) + "," + (cy + R2_ * Math.sin(a)).toFixed(1));
        }
        svg.appendChild(E("polyline", { points: pts.join(" "), fill: "none", stroke: "#c4622d", "stroke-width": 2, "stroke-dasharray": "4 3" }));
        svg.appendChild(T(cx + 78, cy - 14, "旋转了 " + deg + "°", { "font-size": 14, "font-weight": 700, fill: "#c4622d" }));
        svg.appendChild(T(cx - 8, cy + 24, "O 顶点", { "font-size": 12, fill: "#8d857a" }));
        svg.appendChild(T(cx + L / 2, cy - 10, "边 1", { "font-size": 12, fill: "#5c554d" }));
        svg.appendChild(T(cx + 14, cy - L / 2 - 6, "边 2", { "font-size": 12, fill: "#5c554d" }));
      } else {
        const a0 = -deg * Math.PI / 180;
        const ex = cx + L * Math.cos(a0), ey = cy + L * Math.sin(a0);
        svg.appendChild(E("line", { x1: cx, y1: cy, x2: cx + L, y2: cy, stroke: "#2f6b52", "stroke-width": 3, "stroke-linecap": "round" }));
        svg.appendChild(E("line", { x1: cx, y1: cy, x2: ex, y2: ey, stroke: "#2f6b52", "stroke-width": 3, "stroke-linecap": "round" }));
        svg.appendChild(E("circle", { cx, cy, r: 4, fill: "#2b2723" }));
        const a1 = deg > 180 ? -180 * Math.PI / 180 : a0;
        svg.appendChild(E("path", { d: `M${cx + 42} ${cy} A42 42 0 0 ${deg > 180 ? 1 : 0} ${cx + 42 * Math.cos(a1)} ${cy + 42 * Math.sin(a1)}`, fill: "#e8f1ec", stroke: "#c4622d", "stroke-width": 1.8 }));
        svg.appendChild(T(cx + 60, cy - 16, deg + "°", { "font-size": 17, "font-weight": 700, fill: "#c4622d" }));
        if (deg === 90) {
          svg.appendChild(E("path", { d: `M${cx + 16} ${cy} h16 v-16`, fill: "none", stroke: "#c4622d", "stroke-width": 1.6 }));
        }
      }
      vis.appendChild(svg);
      out.innerHTML = "<b>" + desc + "</b><br>" +
        (kind === "1"
          ? "三条边的长度完全不同（80 / 150 / 220），但<strong>角度全都是 " + deg + "°</strong>。<br><span style='color:#c4622d'><strong>角的大小只看「转了多少」，与边长无关。</strong></span>"
          : kind === "2"
            ? "角 = <strong>从边 1 转到边 2，<span style='color:#c4622d'>转过的角度</span></strong>。<br>它有 <strong>1 个顶点、2 条边</strong>，是<strong>旋转的量</strong>，不是两条线的交点。"
            : "小于 90° 是<strong>锐角</strong>，等于 90° 是<strong>直角</strong>，大于 90° 小于 180° 是<strong>钝角</strong>。");
    }
    on("ag-r", "input", go); on("ag-type", "input", go);
    go();
  }

  /* ======================================================================
     ② 多边形内角和 —— 边越多，和越大，但增量是恒定的
     ====================================================================== */
  function polyDemo() {
    const host = $("pg-demo"); if (!host) return;
    const vis = $("pg-vis"), out = $("pg-out");
    const r = $("pg-r"), rv = $("pg-rv");
    const type = $("pg-type");

    function go() {
      const n = +r.value;   // 边数
      rv.textContent = n + " 边形";
      const kind = type.value;
      const cx = 220, cy = 150, R = 108;

      vis.innerHTML = "";
      const W = 640, H = 300;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const pts = [];
      const rot = -Math.PI / 2;
      for (let i = 0; i < n; i++) {
        const a = rot + (2 * Math.PI * i) / n;
        pts.push([R2(cx + R * Math.cos(a)), R2(cy + R * Math.sin(a))]);
      }
      const poly = pts.map((p) => p.join(",")).join(" ");
      svg.appendChild(E("polygon", { points: poly, fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5 }));

      if (kind === "0") {
        // 标出所有内角
        for (let i = 0; i < n; i++) {
          const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
          const a1 = Math.atan2(prev[1] - cur[1], prev[0] - cur[0]);
          let a2 = Math.atan2(next[1] - cur[1], next[0] - cur[0]);
          let d = a2 - a1;
          while (d <= -Math.PI) d += 2 * Math.PI;
          while (d > Math.PI) d -= 2 * Math.PI;
          const r1 = 26;
          const x1 = cur[0] + r1 * Math.cos(a1), y1 = cur[1] + r1 * Math.sin(a1);
          const x2 = cur[0] + r1 * Math.cos(a2), y2 = cur[1] + r1 * Math.sin(a2);
          svg.appendChild(E("path", { d: `M${R2(x1)} ${R2(y1)} A26 26 0 0 ${d > 0 ? 1 : 0} ${R2(x2)} ${R2(y2)}`, fill: "none", stroke: "#c4622d", "stroke-width": 1.6 }));
        }
        svg.appendChild(T(cx, cy + 4, "所有内角加起来", { "text-anchor": "middle", "font-size": 14, fill: "#2f6b52", "font-weight": 600 }));
        svg.appendChild(T(cx, cy + 30, (n - 2) * 180 + "°", { "text-anchor": "middle", "font-size": 24, "font-weight": 700, fill: "#c4622d" }));
      } else {
        // 拆一个角
        svg.appendChild(E("line", { x1: pts[0][0], y1: pts[0][1], x2: cx, y2: cy, stroke: "#c4622d", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
        svg.appendChild(T(pts[0][0] - 18, pts[0][1] - 12, "对角线", { "font-size": 11.5, fill: "#c4622d" }));
        svg.appendChild(T(cx + 30, cy - 10, "分成 2 个角", { "font-size": 12.5, fill: "#5c554d" }));
        const each = (n - 2) * 180 / (n - 2);
        svg.appendChild(T(cx - 70, cy + 46, "每多一条边，内角和 +180°", { "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
      }
      vis.appendChild(svg);

      const sum = (n - 2) * 180;
      out.innerHTML = kind === "0"
        ? "<b>" + n + " 边形的内角和 = " + sum + "°</b><br>" +
          "公式：<b>(n − 2) × 180°</b>。三角形 180°，四边形 360°，五边形 540°……<br>" +
          "<span style='color:#c4622d'><strong>每多一条边，内角和就多 180°</strong>——因为<strong>多一个顶点，就多出两个角</strong>，而三角形内角和恒为 180°。</span>"
        : "<b>为什么是 (n−2)×180°？</b><br>" +
          "从任意一个顶点画对角线，把 n 边形<strong>拆成 (n−2) 个三角形</strong>。<br>" +
          "每个三角形内角和都是 180°，加起来就是 <b>(n−2)×180°</b>。<br>" +
          "<span style='color:#c4622d'><strong>所以这不是规定，是「n 边形 = (n−2) 个三角形」的直接结果。</strong></span>";
    }
    on("pg-r", "input", go); on("pg-type", "input", go);
    go();
  }

  /* ======================================================================
     ③ 圆 —— 唯一「用一条线」定义的图形
     ====================================================================== */
  function circleDemo() {
    const host = $("ci-demo"); if (!host) return;
    const vis = $("ci-vis"), out = $("ci-out");
    const r = $("ci-r"), rv = $("ci-rv");
    const mode = $("ci-mode");

    function go() {
      const R = +r.value;
      rv.textContent = R;
      const m = mode.value;
      vis.innerHTML = "";
      const W = 640, H = 250, cx = 200, cy = 120;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const scale = 70 / 10;   // 10 → 70px

      if (m === "0") {
        // 一条线决定整个图形
        const r = R * scale;
        svg.appendChild(E("circle", { cx, cy, r, fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5 }));
        svg.appendChild(E("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, stroke: "#c4622d", "stroke-width": 2, "marker-end": "" }));
        svg.appendChild(E("circle", { cx, cy, r: 3.5, fill: "#2b2723" }));
        svg.appendChild(T(cx + r / 2, cy - 8, "r = " + R, { "font-size": 14, "font-weight": 700, fill: "#c4622d" }));
        svg.appendChild(T(cx - 6, cy + 16, "O", { "font-size": 12, fill: "#8d857a" }));
        svg.appendChild(T(360, 80, "圆上所有点到圆心的距离", { "font-size": 13.5, fill: "#5c554d" }));
        svg.appendChild(T(360, 104, "都等于半径 " + R, { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(360, 130, "所以：知道「圆心 + 半径」", { "font-size": 13, fill: "#5c554d" }));
        svg.appendChild(T(360, 152, "就能确定<tspan/>整个圆", { "font-size": 13, fill: "#5c554d" }));
        // 证明：随机点
        for (let i = 0; i < 8; i++) {
          const a = (2 * Math.PI * i) / 8;
          svg.appendChild(E("circle", { cx: cx + r * Math.cos(a), cy: cy + r * Math.sin(a), r: 4, fill: "#c4622d", opacity: .7 }));
        }
        svg.appendChild(T(360, 180, "对比：三角形要 3 条边才能定", { "font-size": 12.5, fill: "#8d857a" }));
      } else {
        // 周长就是「滚动一圈」
        const r = R * scale;
        svg.appendChild(E("circle", { cx, cy, r, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        const circ = 2 * Math.PI * r;
        const p0 = [cx, cy - r], p1 = [cx + circ, cy - r];
        svg.appendChild(E("line", { x1: p0[0], y1: p0[1], x2: p0[0] + circ, y2: p0[1], stroke: "#c4622d", "stroke-width": 3, "stroke-linecap": "round" }));
        // 滚动的圈
        for (let i = 0; i < 3; i++) {
          svg.appendChild(E("circle", { cx: p0[0] + r + i * circ, cy: p0[1] - r, r: r, fill: "none", stroke: "#6aa287", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
        }
        svg.appendChild(T(p0[0], p0[1] - 12, "C", { "text-anchor": "middle", "font-size": 12, fill: "#c4622d" }));
        svg.appendChild(T(360, 80, "把圆沿直线<tspan/>滚一圈", { "font-size": 13.5, fill: "#5c554d" }));
        svg.appendChild(T(360, 104, "它正好<tspan/>滚了 3 圈", { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(360, 130, "C = πd ≈ 3.14d", { "font-size": 16, "font-weight": 700, fill: "#2f6b52" }));
        svg.appendChild(T(360, 156, "「周长 = 3.14 × 直径」", { "font-size": 13, fill: "#5c554d" }));
        svg.appendChild(T(360, 178, "就是这样来的", { "font-size": 12.5, fill: "#8d857a" }));
      }
      vis.appendChild(svg);
      out.innerHTML = m === "0"
        ? "<b>圆 = 圆心 + 半径</b>　周长 C = 2πr　面积 S = πr²<br>" +
          "<span style='color:#c4622d'><strong>圆是唯一「只需要一条线（半径）+ 一个点（圆心）」就能确定的图形</strong>——三角形要 3 条边，长方形要 4 条边+角度，圆只要 2 个数据。</span>"
        : "<b>周长 C = πd ≈ 3.14d</b><br>" +
          "<span style='color:#c4622d'><strong>不是规定，是「滚一圈」的结果</strong>。孩子在地上滚一个轮子，看它滚几圈，就知道 3.14 是怎么来的——<strong>比背公式有用得多</strong>。</span>";
    }
    on("ci-r", "input", go); on("ci-mode", "input", go);
    go();
  }

  function boot() { angleDemo(); polyDemo(); circleDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
