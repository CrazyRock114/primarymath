/* ==========================================================================
   demos.js —— 可操作图示
   ---------------------------------------------------------------------------
   原则：每个图示只回答一个问题，且必须能被孩子的手改变。
   做法：用输入控件改变状态，用 SVG 呈现结果，用一句大白话解释结果。
   ========================================================================== */
/* SVG 辅助：所有图示共用，必须在全局（下面的图示定义在 IIFE 之外） */
var NS = "http://www.w3.org/2000/svg";
var el = function (n, a) {
  var e = document.createElementNS(NS, n);
  for (var k in a) e.setAttribute(k, a[k]);
  return e;
};

(function () {
  "use strict";

  const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const PLACE = [
    { n: 1e8, u: "亿" }, { n: 1e7, u: "千万" }, { n: 1e6, u: "百万" },
    { n: 1e5, u: "十万" }, { n: 1e4, u: "万" }, { n: 1e3, u: "千" },
    { n: 1e2, u: "百" }, { n: 1e1, u: "十" }, { n: 1, u: "个" },
  ];

  /* ======================================================================
     图示一：位值制 —— 同样的数字，换个位置就完全不是一回事
     控件：四个滑块（千 百 十 个）
     问孩子：为什么 105 和 501 里的 5 意思不一样？
     ====================================================================== */
  function placeValueDemo() {
    const host = document.getElementById("pv-demo");
    if (!host) return;
    const vals = [0, 1, 5, 0];
    const cols = document.querySelectorAll("#pv-demo input[type=range]");
    const out = document.getElementById("pv-out");
    const vis = document.getElementById("pv-vis");

    function draw() {
      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 640 168", width: "100%", height: "auto" });

      // 数位必须与滑块数量严格一致：4 个滑块 = 千 百 十 个
      PLACE.slice(5).forEach((p, i) => {
        const d = vals[i];
        const x = 70 + i * 138;
        // 数位格
        svg.appendChild(el("rect", {
          x: x, y: 44, width: 96, height: 60, rx: 10,
          fill: d ? "#e8f1ec" : "#faf7f2", stroke: d ? "#2f6b52" : "#e5ded2",
          "stroke-width": d ? 2 : 1.5,
        }));
        // 数字
        const t = el("text", {
          x: x + 48, y: 86, "text-anchor": "middle",
          "font-size": 34, "font-weight": 700,
          fill: d ? "#1f4a38" : "#cfc7ba", "font-family": "ui-monospace, monospace",
        });
        t.textContent = d;
        svg.appendChild(t);
        // 数位标签
        const l = el("text", {
          x: x + 48, y: 128, "text-anchor": "middle",
          "font-size": 14, fill: "#8d857a",
        });
        l.textContent = p.u + "位";
        svg.appendChild(l);
        // 该位代表的量
        const v = el("text", {
          x: x + 48, y: 22, "text-anchor": "middle", "font-size": 14,
          fill: d ? "#2f6b52" : "#cfc7ba", "font-weight": 600,
        });
        v.textContent = d ? "= " + d * p.n : "—";
        svg.appendChild(v);
      });
      vis.appendChild(svg);
    }

    function explain() {
      const num = vals[0] * 1000 + vals[1] * 100 + vals[2] * 10 + vals[3];
      const parts = [];
      vals.forEach((d, i) => { if (d) parts.push(d + " 个" + PLACE.slice(5)[i].u); });
      out.innerHTML =
        "这个数是 <b>" + num + "</b>。" +
        (parts.length
          ? " 拆开看：<b>" + parts.join(" + ") + "</b>。<br>" +
            "注意 —— 每个数字的<b>值</b>，不取决于它是几，取决于它<b>站在哪个位置</b>。"
          : " 现在全是 0。再拖动上面的滑块试试。");
    }

    cols.forEach((c, i) => c.addEventListener("input", () => {
      vals[i] = +c.value;
      c.nextElementSibling.textContent = c.value;
      draw(); explain();
    }));
    draw(); explain();
  }

  /* ======================================================================
     图示二：数轴细分 —— 为什么需要小数、分数、负数
     控件：细分层级 0→4
     问孩子：0 和 1 中间，能塞进多少个数？
     ====================================================================== */
  function lineDemo() {
    const host = document.getElementById("line-demo");
    if (!host) return;
    const out = document.getElementById("line-out");
    const vis = document.getElementById("line-vis");
    const r = document.getElementById("line-range");
    const lv = document.getElementById("line-val");

    const LEVELS = [
      { n: 1, s: "0 和 1 之间，再也放不下任何数了。", tag: "只有整数" },
      { n: 2, s: "中间放进 0.5。这就是小数的起点 —— <b>0.5</b>。", tag: "1 刀" },
      { n: 4, s: "每份再切一半，出现 <b>0.25、0.75</b>。", tag: "2 刀" },
      { n: 10, s: "十等分：<b>0.1</b> 到 <b>0.9</b>。这就是<b>十分位</b>。", tag: "10 等分" },
      { n: 100, s: "十等分的十等分：<b>0.01</b>。这就是<b>百分位</b>。", tag: "100 等分" },
      { n: 1000, s: "再细分就是 <b>0.001</b>…… 数轴永远可以继续切下去。", tag: "1000 等分" },
    ];

    function draw(k) {
      const L = LEVELS[k];
      vis.innerHTML = "";
      const W = 640, H = 130, x0 = 60, x1 = W - 60, y = 74, Lw = x1 - x0;
      const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

      svg.appendChild(el("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: "#2b2723", "stroke-width": 2.5 }));
      // 箭头
      svg.appendChild(el("path", { d: `M${x1} ${y} l-11 -6 v12 z`, fill: "#2b2723" }));
      svg.appendChild(el("path", { d: `M${x0} ${y} l11 -6 v12 z`, fill: "#2b2723" }));

      const n = L.n;
      const step = n === 1 ? 0 : Lw / (n - (n === 2 ? 1 : 1));
      // 均匀刻度：n 等分对应 n+1 个刻度点（0, 1/n, 2/n, ..., 1）
      // 原先循环 i < parts 且除以 (parts-1)：10 等分只画 10 个点、中点算成 5/9≈0.6，
      // 且 n=1 时分母为 0 直接产生 NaN
      const parts = n;
      for (let i = 0; i <= parts; i++) {
        const x = x0 + (Lw * i) / parts;
        const isEnd = i === 0 || i === parts;
        svg.appendChild(el("line", {
          x1: x, y1: y - (isEnd ? 11 : 6), x2: x, y2: y + (isEnd ? 11 : 6),
          stroke: isEnd ? "#2b2723" : "#6aa287", "stroke-width": isEnd ? 2.5 : 1.5,
        }));
        if (parts <= 10 || isEnd) {
          const frac = i / parts;
          const v = isEnd ? String(frac) : frac.toFixed(k >= 3 ? (k === 3 ? 1 : 2) : 2).replace(/0+$/, "").replace(/\.$/, "");
          const t = el("text", {
            x: x, y: y - 18, "text-anchor": "middle", "font-size": isEnd ? 15 : 11.5,
            fill: isEnd ? "#2b2723" : "#6aa287", "font-weight": isEnd ? 700 : 400,
          });
          t.textContent = v;
          svg.appendChild(t);
        }
      }
      // 0 与 1 之间的填充区间
      if (parts > 1) {
        svg.appendChild(el("rect", {
          x: x0, y: y - 30, width: Lw, height: 30, fill: "#e8f1ec", opacity: .55, rx: 4,
        }));
      }
      vis.appendChild(svg);
    }

    function go() {
      const k = +r.value;
      lv.textContent = LEVELS[k].tag;
      draw(k);
      out.innerHTML = LEVELS[k].s;
    }
    r.addEventListener("input", go);
    go();
  }

  /* ======================================================================
     图示三：负数 —— 温度计，方向从哪来
     控件：温度滑块 -20 → 20
     ====================================================================== */
  function tempDemo() {
    const host = document.getElementById("temp-demo");
    if (!host) return;
    const r = document.getElementById("temp-range");
    const out = document.getElementById("temp-out");
    const vis = document.getElementById("temp-vis");
    const rv = document.getElementById("temp-val");   // 滑块旁的读数，原先没接线恒为空

    function go() {
      const t = +r.value;
      if (rv) rv.textContent = t + "℃";
      const H = 220, cx = 130, top = 16, bot = H - 16, mid = (top + bot) / 2;
      const sc = (bot - top) / 44; // -22..22
      const y = mid - t * sc;
      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 640 " + H, width: "100%" });

      // 水银柱
      svg.appendChild(el("rect", {
        x: cx - 13, y: Math.min(y, mid), width: 26,
        height: Math.abs(mid - y) || 2, rx: 13,
        fill: t >= 0 ? "#c4622d" : "#4a5b8c",
      }));
      // 球
      svg.appendChild(el("circle", { cx: cx, cy: bot + 4, r: 17, fill: "#e5ded2", stroke: "#8d857a", "stroke-width": 2 }));
      // 0 刻度
      svg.appendChild(el("line", { x1: cx - 34, y1: mid, x2: cx + 34, y2: mid, stroke: "#2b2723", "stroke-width": 2 }));
      // 刻度
      for (let v = -20; v <= 20; v += 5) {
        const yy = mid - v * sc;
        svg.appendChild(el("line", { x1: cx - 7, y1: yy, x2: cx + 7, y2: yy, stroke: "#cfc7ba", "stroke-width": 1.5 }));
        const s = el("text", { x: cx - 14, y: yy + 4, "text-anchor": "end", "font-size": 11.5, fill: "#8d857a" });
        s.textContent = v; svg.appendChild(s);
      }
      // 数字
      const num = el("text", { x: cx + 52, y: mid - t * sc + 6, "font-size": 26, "font-weight": 700, fill: t >= 0 ? "#c4622d" : "#4a5b8c" });
      num.textContent = (t > 0 ? "+" : "") + t + "℃";
      svg.appendChild(num);
      vis.appendChild(svg);

      out.innerHTML =
        "现在读数是 <b>" + (t > 0 ? "+" + t : t) + "℃</b>。" +
        (t > 0
          ? " 正数在 <b>0 的上方</b>。为什么？因为人类先确定了「0 是冰点」这个<b>基准</b>，往暖的方向记正，往冷的方向记负。"
          : t < 0
          ? " 负数在 <b>0 的下方</b>。这个「负」字本身没有好坏，它只是说：<b>跟基准反了一个方向</b>。"
          : " 正好是 0。0 是<b>分界线</b>，不是「什么都没有」——它是正负的分界。");
    }
    r.addEventListener("input", go);
    go();
  }

  /* ======================================================================
     图示四：天平 —— 等号是关系不是箭头（支柱四用，放在公共文件里）
     ====================================================================== */
  function scaleDemo() {
    const host = document.getElementById("scale-demo");
    if (!host) return;
    const out = document.getElementById("scale-out");
    const a = document.getElementById("sc-a"), b = document.getElementById("sc-b");
    const av = document.getElementById("sc-av"), bv = document.getElementById("sc-bv");

    function go() {
      const L = +a.value, R = +b.value;
      av.textContent = L; bv.textContent = R;
      const d = Math.max(-16, Math.min(16, (L - R) * 2.2));
      const H = 190, w = 560, cx = w / 2, pivotY = 168;
      const vis = document.getElementById("scale-vis");
      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 " + w + " " + H, width: "100%" });

      // 立柱
      svg.appendChild(el("line", { x1: cx, y1: pivotY - 78, x2: cx, y2: pivotY - 10, stroke: "#8d857a", "stroke-width": 5, "stroke-linecap": "round" }));
      svg.appendChild(el("path", { d: `M${cx - 30} ${pivotY - 8} h60 l-12 14 h-36 z`, fill: "#8d857a" }));
      // 横梁（倾斜）
      const yl = 84 + d, yr = 84 - d;
      svg.appendChild(el("line", { x1: cx - 200, y1: yl, x2: cx + 200, y2: yr, stroke: "#2f6b52", "stroke-width": 6, "stroke-linecap": "round" }));
      // 两个盘
      [-1, 1].forEach((s) => {
        const y = s < 0 ? yl : yr, x = cx + s * 200;
        svg.appendChild(el("line", { x1: x, y1: y, x2: x, y2: y + 22, stroke: "#8d857a", "stroke-width": 1.5 }));
        svg.appendChild(el("path", { d: `M${x - 46} ${y + 22} h92 a46 20 0 0 1 -92 0 z`, fill: "#f3efe7", stroke: "#8d857a", "stroke-width": 2 }));
        const t = el("text", { x: x, y: y + 20, "text-anchor": "middle", "font-size": 19, "font-weight": 700, fill: "#2b2723" });
        t.textContent = s < 0 ? L : R;
        svg.appendChild(t);
      });
      // 支点标记
      const dot = el("circle", { cx: cx, cy: pivotY - 78, r: 6, fill: "#c4622d" });
      svg.appendChild(dot);
      vis.appendChild(svg);

      const bal = Math.abs(L - R) < 0.5;
      out.innerHTML = bal
        ? "天平是<b>平的</b>。这说明：左边和右边<b>一样重</b>。<br>等号说的是这个<b>状态</b>，不是一条「算完了→写答案」的指令。"
        : "天平<b>歪了</b>，左边" + (L > R ? "更重" : "更轻") + "。<br>所以 <b>" + L + " ≠ " + R + "</b>。要让它平，你得往" + (L > R ? "右" : "左") + "边加东西。";
    }
    a.addEventListener("input", go);
    b.addEventListener("input", go);
    go();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    placeValueDemo();
    lineDemo();
    tempDemo();
    scaleDemo();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/* ==========================================================================
   demos2.js 的内容（同一文件续写）
   ========================================================================== */

/* ======================================================================
   图示五：单位塔 —— 为什么 1 米 = 100 厘米
   问孩子：单位不是随便定的，是为了让「同一种东西」能对齐
   ====================================================================== */
function unitDemo() {
  const host = document.getElementById("unit-demo");
  if (!host) return;
  const out = document.getElementById("unit-out");
  const vis = document.getElementById("unit-vis");
  const r = document.getElementById("unit-range");
  const rv = document.getElementById("unit-rv");

  // 从大到小，每一级是上一级的 1/10
  const U = [
    { n: "千米", f: 1000, sym: "km" },
    { n: "米",   f: 1,    sym: "m" },
    { n: "分米", f: 0.1,  sym: "dm" },
    { n: "厘米", f: 0.01, sym: "cm" },
    { n: "毫米", f: 0.001,sym: "mm" },
  ];
  // 以 1 厘米为一格的可视长度上限：覆盖 1 千米 = 100000 厘米
  const STEP = [0, 1, 2, 3, 4, 5, 6];   // 滑块档位 = 以米为单位

  // 注意：不能用 String(+x.toFixed(2)) —— 那会先转回数字 20，字符串里没有 ".00"，
  // 再去正则去尾随 0 就会把 20 砍成 2、100 砍成 1。必须先去小数尾零再转字符串。
  function fmt(x) {
    if (!isFinite(x)) return "—";
    if (Number.isInteger(x)) return String(x);
    let t = x >= 1 ? x.toFixed(2) : x.toPrecision(3);
    if (t.indexOf(".") >= 0) t = t.replace(/0+$/, "").replace(/\.$/, "");
    return t;
  }

  function go() {
    const m = STEP[+r.value];
    rv.textContent = m + " 米";
    vis.innerHTML = "";
    const W = 640, rowH = 52, y0 = 18;
    const svg = el("svg", { viewBox: "0 0 " + W + " " + (y0 + U.length * rowH + 14), width: "100%" });

    U.forEach((u, i) => {
      const v = m / u.f;                       // m 米 = 多少个该单位
      const y = y0 + i * rowH;
      const text = fmt(v) + " " + u.n;
      // 数字
      const t = el("text", {
        x: 12, y: y + 26, "font-size": 15, "font-weight": 700,
        fill: i === 1 ? "#2f6b52" : "#2b2723",
      });
      t.textContent = text;
      svg.appendChild(t);
      // 竖线分隔
      svg.appendChild(el("line", { x1: 4, y1: y + 36, x2: W - 4, y2: y + 36, stroke: "#f0ebe1", "stroke-width": 1.5 }));
      // 单位符号
      const sym = el("text", { x: W - 12, y: y + 26, "text-anchor": "end", "font-size": 12.5, fill: "#b5aca0" });
      sym.textContent = u.sym;
      svg.appendChild(sym);
      // 级间关系标注
      if (i > 0) {
        // 进率不能写死：千米→米 是 1000，其余相邻级才是 10
        const rate = U[i - 1].f / U[i].f;
        const rel = el("text", { x: W / 2 + 40, y: y + 12, "text-anchor": "middle", "font-size": 12, fill: "#c4622d", "font-weight": 600 });
        rel.textContent = "↓ 上一级 ÷ " + (Number.isInteger(rate) ? rate : rate.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""));
        svg.appendChild(rel);
      }
    });
    vis.appendChild(svg);

    out.innerHTML =
      "同一段长度 <b>" + m + " 米</b>，用不同单位说就是：<br>" +
      "<b>" + U.map((u) => fmt(m / u.f) + " " + u.n).join("　/　") + "</b><br>" +
      "单位越<b>小</b>，数字就<b>越往右</b>（越多）；单位越大，数字越少。<br>" +
      "换算永远是<strong>只做一件事：乘进率或除进率</strong>。相邻两级之间是 ×10（米→分米→厘米），跨级要看进率（米→千米是 ×1000）——<strong>原理只有一个，动作是乘除</strong>。";
  }
  r.addEventListener("input", go);
  go();
}

/* ======================================================================
   图示六：割补转化 —— 平行四边形怎么变成等面积的长方形
   问孩子：为什么平行四边形的面积 = 长 × 高，而不是 × 斜边
   ====================================================================== */
function shearDemo() {
  const host = document.getElementById("shear-demo");
  if (!host) return;
  const out = document.getElementById("shear-out");
  const vis = document.getElementById("shear-vis");
  const r = document.getElementById("shear-r");
  const rv = document.getElementById("shear-rv");

  function go() {
    const k = +r.value / 100;             // 剪切量 0..1
    const W = 640, H = 260, ox = 90, oy = 30, bw = 300, bh = 130;
    vis.innerHTML = "";
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
    const dx = k * bh;

    // 剪切前
    svg.appendChild(el("polygon", {
      points: `${ox},${oy} ${ox + bw},${oy} ${ox + bw + dx},${oy + bh} ${ox + dx},${oy + bh}`,
      fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2.5,
    }));
    const t0 = el("text", { x: ox + bw / 2, y: oy - 8, "text-anchor": "middle", "font-size": 14, fill: "#5c554d" });
    t0.textContent = k < .04 ? "平行四边形" : "剪切中…";
    svg.appendChild(t0);

    // 剪切箭头
    if (k > .04 && k < .96) {
      svg.appendChild(el("path", {
        d: `M${ox + bw - 26} ${oy + bh + 22} q14 8 30 0`, fill: "none",
        stroke: "#c4622d", "stroke-width": 2, "marker-end": "",
      }));
    }

    // 剪切后 → 长方形
    const rx = ox + 360;
    svg.appendChild(el("rect", {
      x: rx, y: oy, width: bw, height: bh,
      fill: k > .96 ? "#e8f1ec" : "#f3efe7", stroke: "#2f6b52", "stroke-width": 2.5,
      "stroke-dasharray": k > .96 ? "" : "6 4",
    }));
    if (k > .96) {
      const t1 = el("text", { x: rx + bw / 2, y: oy - 8, "text-anchor": "middle", "font-size": 14, fill: "#2f6b52", "font-weight": 700 });
      t1.textContent = "长方形";
      svg.appendChild(t1);
    }
    // 高
    if (k > .96) {
      svg.appendChild(el("line", { x1: rx, y1: oy + bh + 30, x2: rx + bw, y2: oy + bh + 30, stroke: "#c4622d", "stroke-width": 2 }));
      svg.appendChild(el("line", { x1: rx, y1: oy + bh + 24, x2: rx, y2: oy + bh + 36, stroke: "#c4622d", "stroke-width": 2 }));
      svg.appendChild(el("line", { x1: rx + bw, y1: oy + bh + 24, x2: rx + bw, y2: oy + bh + 36, stroke: "#c4622d", "stroke-width": 2 }));
      const t2 = el("text", { x: rx + bw / 2, y: oy + bh + 52, "text-anchor": "middle", "font-size": 13.5, fill: "#c4622d", "font-weight": 600 });
      t2.textContent = "底 = 长";
      svg.appendChild(t2);
      const t3 = el("text", { x: rx - 16, y: oy + bh / 2, "text-anchor": "end", "font-size": 13.5, fill: "#c4622d", "font-weight": 600 });
      t3.textContent = "高";
      svg.appendChild(t3);
    }
    vis.appendChild(svg);

    out.innerHTML = k > .96
      ? "剪完了。<b>面积一点没变</b> —— 没有任何一块被丢下，也没有任何一块被添上。<br>" +
        "所以平行四边形的面积就等于<b>长方形的面积</b> = <b>底 × 高</b>。" +
        "注意：底是<b>长</b>，不是那条斜边。"
      : "继续往右拖。想象你<b>拿一把剪刀，沿高所在的方向剪下一块</b>，平移到右边。";
  }
  r.addEventListener("input", () => { rv.textContent = r.value; go(); });
  go();
}

/* ======================================================================
   图示七：倍数关系 —— 谁是 1 倍量，谁是几倍量
   ====================================================================== */
function multipleDemo() {
  const host = document.getElementById("mul-demo");
  if (!host) return;
  const out = document.getElementById("mul-out");
  const vis = document.getElementById("mul-vis");
  const a = document.getElementById("mul-a");
  const k = document.getElementById("mul-k");
  const av = document.getElementById("mul-av");
  const kv = document.getElementById("mul-kv");

  function go() {
    const A = +a.value, K = +k.value;
    av.textContent = A; kv.textContent = K;
    const B = A * K;
    const W = 640, H = 200, y1 = 60, y2 = 130, maxW = 470, ox = 110;
    const scale = maxW / Math.max(A * 6, A * K || 1);
    vis.innerHTML = "";
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

    // 1倍量
    const w1 = A * scale;
    svg.appendChild(el("rect", { x: ox, y: y1, width: w1, height: 40, rx: 5, fill: "#6aa287" }));
    const t1 = el("text", { x: ox + w1 / 2, y: y1 + 25, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: "#fff" });
    t1.textContent = "1倍量 " + A;
    svg.appendChild(t1);
    const l1 = el("text", { x: ox - 14, y: y1 + 25, "text-anchor": "end", "font-size": 14, fill: "#5c554d" });
    l1.textContent = "1倍量：";
    svg.appendChild(l1);

    // K倍量 = K 个 1倍量
    const w2 = B * scale;
    svg.appendChild(el("rect", { x: ox, y: y2, width: w2, height: 40, rx: 5, fill: "#c4622d" }));
    for (let i = 1; i < K; i++) {
      svg.appendChild(el("line", {
        x1: ox + (w2 * i) / K, y1: y2, x2: ox + (w2 * i) / K, y2: y2 + 40,
        stroke: "#fff", "stroke-width": 2,
      }));
    }
    const t2 = el("text", { x: ox + w2 / 2, y: y2 + 25, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: "#fff" });
    t2.textContent = K + "倍量 " + B;
    svg.appendChild(t2);
    const l2 = el("text", { x: ox - 14, y: y2 + 25, "text-anchor": "end", "font-size": 14, fill: "#5c554d" });
    l2.textContent = K + "倍量：";
    svg.appendChild(l2);

    // 分组括号
    svg.appendChild(el("path", {
      d: `M${ox} ${y2 + 46} h${w2} M${ox} ${y2 + 41} v10 M${ox + w2} ${y2 + 41} v10`,
      fill: "none", stroke: "#c4622d", "stroke-width": 1.5,
    }));
    const t3 = el("text", { x: ox + w2 / 2, y: y2 + 66, "text-anchor": "middle", "font-size": 12.5, fill: "#c4622d" });
    t3.textContent = "正好 " + K + " 个 1 倍量";
    svg.appendChild(t3);
    vis.appendChild(svg);

    out.innerHTML =
      "看清楚这条关系：<b>" + K + "倍量 里面，正好装着 " + K + " 个 1 倍量</b>。<br>" +
      "所以求 1 倍量要<b>除以</b> " + K + "（把" + K + "份缩回 1 份），" +
      "求几倍量要<b>乘以</b> " + K + "（把 1 份复制成 " + K + " 份）。<br>" +
      "<b>先问「谁是 1 倍量」</b>，乘除就自动定了。";
  }
  a.addEventListener("input", go);
  k.addEventListener("input", go);
  go();
}

/* ======================================================================
   图示八：单位对齐 —— 为什么小数点要上下对齐
   ====================================================================== */
function alignDemo() {
  const host = document.getElementById("align-demo");
  if (!host) return;
  const out = document.getElementById("align-out");
  const vis = document.getElementById("align-vis");
  const r = document.getElementById("align-r");
  const rv = document.getElementById("align-rv");

  function go() {
    const mode = +r.value;               // 0=末位对齐(错) 1=小数点对齐(对)
    rv.textContent = mode ? "小数点对齐" : "末位对齐";
    const W = 640, H = 210, ox = 150;
    vis.innerHTML = "";
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
    const cols = ["个", "十", "百", "千", "万", "十", "百", "千", "万"];
    const a = ["3", ".", "2", "1", "5", "", "", "", ""];
    const b = ["1", ".", "4", "", "", "", "", "", ""];
    const yA = 70, yB = 140, cw = 52, ch = 42;

    function drawRow(y, chars, highlightBad) {
      // 竖线
      for (let i = 0; i < 9; i++) {
        svg.appendChild(el("line", {
          x1: ox + i * cw, y1: y - 6, x2: ox + i * cw, y2: y + ch + 6,
          stroke: "#e5ded2", "stroke-width": 1.5,
        }));
      }
      svg.appendChild(el("line", { x1: ox + 9 * cw, y1: y - 6, x2: ox + 9 * cw, y2: y + ch + 6, stroke: "#e5ded2", "stroke-width": 1.5 }));
      chars.forEach((c, i) => {
        if (c === "") return;
        if (c === ".") return;
        const t = el("text", {
          x: ox + i * cw + cw / 2, y: y + 30, "text-anchor": "middle",
          "font-size": 24, "font-weight": 700, "font-family": "ui-monospace, monospace",
          fill: highlightBad ? "#c4622d" : "#2b2723",
        });
        t.textContent = c;
        svg.appendChild(t);
        // 位标签
        const l = el("text", { x: ox + i * cw + cw / 2, y: y + ch + 18, "text-anchor": "middle", "font-size": 11, fill: "#b5aca0" });
        l.textContent = cols[i];
        svg.appendChild(l);
      });
    }

    // 对齐：把 b 的数字按模式摆放
    const bpos = mode
      ? ["1", ".", "4", "", "", "", "", "", ""]                        // 小数点对齐
      : ["", "", "", "1", ".", "4", "", "", ""];                       // 末位对齐（错）
    const apos = mode
      ? ["3", ".", "2", "1", "5", "", "", "", ""]
      : ["3", "2", "1", "5", ".", "", "", "", ""];

    // 小数点
    const dotIdx = (arr) => arr.indexOf(".");
    [[yA, apos], [yB, bpos]].forEach(([y, arr]) => {
      const di = arr.indexOf(".");
      if (di >= 0) {
        svg.appendChild(el("text", {
          x: ox + di * cw + cw / 2, y: y + 30, "text-anchor": "middle",
          "font-size": 24, "font-weight": 700, fill: "#2f6b52",
        })).textContent = ".";
      }
    });

    drawRow(yA, apos, false);
    drawRow(yB, bpos, !mode);

    // 小数点连线
    const da = apos.indexOf("."), db = bpos.indexOf(".");
    if (da >= 0 && db >= 0) {
      svg.appendChild(el("line", {
        x1: ox + da * cw + cw / 2, y1: yA - 12, x2: ox + da * cw + cw / 2, y2: yB - 12,
        stroke: mode ? "#2f6b52" : "#c4622d", "stroke-width": 1.5, "stroke-dasharray": "4 3",
      }));
      const t = el("text", {
        x: ox + (da + db) / 2 * cw + cw / 2, y: yA - 18, "text-anchor": "middle",
        "font-size": 12, fill: mode ? "#2f6b52" : "#c4622d", "font-weight": 600,
      });
      t.textContent = mode ? "小数点对齐 ✓ 同一个数量单位" : "末位对齐 ✗ 单位错位了";
      svg.appendChild(t);
    }
    vis.appendChild(svg);

    out.innerHTML = mode
      ? "<b>对齐了。</b> 每一列的<b>数量单位相同</b>（个位对个位，十分位对十分位）。<br>" +
        "只有单位相同，才能直接把数量加起来。这就是小数加减必须<b>对齐小数点</b>的原因。"
      : "看到了吗 —— 两行的小数点<b>不在同一列</b>。<br>" +
        "这一列是「百」，那一列是「十分之一」。<b>单位不一样，不能直接加。</b>" +
        "（这也是为什么整数加法「末位对齐」是对的：个位对个位，天然就是同一个单位）";
  }
  r.addEventListener("input", go);
  go();
}

/* ======================================================================
   图示九：乘法的结构 —— 加法是散装，乘法是打包
   ====================================================================== */
function packDemo() {
  const host = document.getElementById("pack-demo");
  if (!host) return;
  const out = document.getElementById("pack-out");
  const vis = document.getElementById("pack-vis");
  const r = document.getElementById("pack-r");
  const rv = document.getElementById("pack-rv");

  function go() {
    const k = Math.max(2, Math.min(8, +r.value));
    rv.textContent = k + " 份，每份 " + k + " 个";
    const W = 640, H = 300;
    vis.innerHTML = "";
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

    // 阶段1：散装的加法
    const y1 = 46;
    const t1 = el("text", { x: 20, y: y1 + 18, "font-size": 13.5, fill: "#8d857a", "font-weight": 600 });
    t1.textContent = "散装：加法";
    svg.appendChild(t1);
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        svg.appendChild(el("rect", {
          x: 118 + i * 34, y: y1 - 22 + j * 26, width: 26, height: 20, rx: 3,
          fill: "#e8f1ec", stroke: "#6aa287", "stroke-width": 1,
        }));
      }
    }
    const ta = el("text", { x: 118 + k * 34 + 8, y: y1 + 6, "font-size": 14, fill: "#5c554d" });
    ta.textContent = k + " + " + new Array(k - 1).fill(k).join(" + ") + " = " + k * k;
    svg.appendChild(ta);

    // 箭头
    svg.appendChild(el("path", {
      d: "M300 92 L300 116", stroke: "#c4622d", "stroke-width": 2,
    }));
    const tarrow = el("text", { x: 310, y: 110, "font-size": 12.5, fill: "#c4622d" });
    tarrow.textContent = "发现重复了 → 打包";
    svg.appendChild(tarrow);

    // 阶段2：打包的乘法
    const y2 = 170;
    const t2 = el("text", { x: 20, y: y2 + 18, "font-size": 13.5, fill: "#8d857a", "font-weight": 600 });
    t2.textContent = "打包：乘法";
    svg.appendChild(t2);
    for (let i = 0; i < k; i++) {
      svg.appendChild(el("rect", {
        x: 118 + i * 40, y: y2 - 26, width: 34, height: 56, rx: 5,
        fill: "#c4622d", opacity: .85,
      }));
      const tl = el("text", {
        x: 118 + i * 40 + 17, y: y2 + 8, "text-anchor": "middle",
        "font-size": 13, "font-weight": 700, fill: "#fff",
      });
      tl.textContent = k;
      svg.appendChild(tl);
    }
    const tb = el("text", { x: 118 + k * 40 + 12, y: y2 + 6, "font-size": 15, fill: "#2f6b52", "font-weight": 700 });
    tb.textContent = k + " × " + k + " = " + k * k;
    svg.appendChild(tb);
    const tc = el("text", { x: 118, y: y2 + 52, "font-size": 12.5, fill: "#8d857a" });
    tc.textContent = k + " 份（行）× 每份 " + k + " 个（列）= " + k * k;
    svg.appendChild(tc);

    vis.appendChild(svg);
    out.innerHTML =
      "加法和乘法<b>答案一样</b>，但它们<em class='hl'>不是同一件事</em>。<br>" +
      "加法在说：「这里有 " + k + " 个，这里还有 " + k + " 个……」<br>" +
      "乘法在说：「这是 <b>" + k + " 份</b>，<b>每份 " + k + " 个</b>。」<br>" +
      "只有当孩子<strong>先看出「几份、每份几个」</strong>，乘法才是理解，而不只是口诀。";
  }
  r.addEventListener("input", go);
  go();
}

(function () {
  function boot2() {
    unitDemo(); shearDemo(); multipleDemo(); alignDemo(); packDemo();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot2);
  else boot2();
})();
