/* ==========================================================================
   stats.js —— 统计与概率图示（B10 / B11）
   ---------------------------------------------------------------------------
   核心主张：三种统计图是「同一份数据的三种看法」——
     条形图  回答「谁多谁少」（比大小）
     折线图  回答「怎么变的」（看趋势）
     扇形图  回答「占几分之几」（看占比）
   选哪张图，不取决于数据，取决于「你想看什么」。
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 13, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };
  const C = ["#2f6b52", "#c4622d", "#4a5b8c", "#8a5a2b", "#6b4a7a"];

  /* 数据：四个学期的人数 */
  const DATA = {
    label: ["一班", "二班", "三班", "四班"],
    v: [23, 31, 28, 38],
  };

  /* ======================================================================
     ① 分类 —— 统计的起点
     ====================================================================== */
  function classifyDemo() {
    const host = $("cl-demo"); if (!host) return;
    const vis = $("cl-vis"), out = $("cl-out");
    const mode = $("cl-mode");
    // [名称, 类别, 颜色] —— 数量全部由这份清单推导，不另写死数字
    const ITEMS = [
      ["苹果", "水果", "#c4622d"], ["苹果", "水果", "#c4622d"], ["苹果", "水果", "#c4622d"],
      ["香蕉", "水果", "#e8c34a"], ["香蕉", "水果", "#e8c34a"],
      ["葡萄", "水果", "#6b4a7a"],
      ["铅笔", "文具", "#2f6b52"], ["铅笔", "文具", "#2f6b52"],
      ["橡皮", "文具", "#4a5b8c"], ["本子", "文具", "#4a5b8c"],
      ["积木", "玩具", "#8a5a2b"], ["积木", "玩具", "#8a5a2b"],
      ["皮球", "玩具", "#6b4a7a"],
    ];
    const CATS = ["水果", "文具", "玩具"];
    // 按类别实数，别再编假数据
    const byCat = CATS.map((c) => ITEMS.filter((it) => it[1] === c).length);
    const total = ITEMS.length;
    const PER_ROW = 7;

    function go() {
      const m = mode.value;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 250", width: "100%" });

      if (m === "0") {
        // 散乱的实物
        ITEMS.forEach(([nm, , c], i) => {
          const x = 60 + (i % PER_ROW) * 72, y = 55 + Math.floor(i / PER_ROW) * 62;
          svg.appendChild(E("circle", { cx: x, cy: y, r: 20, fill: c, opacity: .85 }));
          svg.appendChild(E("text", { x, y: y + 5, "text-anchor": "middle", "font-size": 10, fill: "#fff" })).textContent = nm[0];
        });
        svg.appendChild(T(60, 215, total + " 个东西散在一起 —— 你能马上说出「苹果有几个」吗？", { "font-size": 13, fill: "#5c554d" }));
      } else {
        // 分好类的三个筐 + 统计表
        CATS.forEach((cat, i) => {
          const x = 50 + i * 200;
          svg.appendChild(E("rect", { x, y: 40, width: 165, height: 100, rx: 10, fill: C[i], opacity: .12, stroke: C[i], "stroke-width": 2, "stroke-dasharray": "5 4" }));
          svg.appendChild(T(x + 82, 68, cat, { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: C[i] }));
          for (let k = 0; k < byCat[i]; k++)
            svg.appendChild(E("circle", { cx: x + 22 + (k % 8) * 17, cy: 105, r: 6, fill: C[i], opacity: .8 }));
        });
        // 统计表
        const tx = 50, ty = 165;
        svg.appendChild(E("rect", { x: tx, y: ty, width: 330, height: 26, fill: "#f3efe7" }));
        svg.appendChild(T(tx + 50, ty + 18, "类别", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#5c554d" }));
        svg.appendChild(T(tx + 150, ty + 18, "数量", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#5c554d" }));
        CATS.forEach((cat, i) => {
          const y = ty + 26 + i * 24;
          svg.appendChild(E("rect", { x: tx, y, width: 330, height: 24, fill: "#fff", stroke: "#e5ded2" }));
          svg.appendChild(T(tx + 50, y + 17, cat, { "text-anchor": "middle", "font-size": 12, fill: "#2b2723" }));
          svg.appendChild(T(tx + 150, y + 17, byCat[i], { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C[i] }));
        });
      }
      vis.appendChild(svg);
      out.innerHTML = m === "0"
        ? "<b>" + total + " 个东西混在一起，统计不了。</b><br>要先<strong>分类</strong>，才能<strong>数得清</strong>。<br>" +
          "<span style='color:#c4622d'><strong>分类是统计的第一步</strong>——不给分类，统计表根本没法填。</span>"
        : "<b>分类之后，每一类数一数，填进表格</b>，统计就完成了。<br>总数 <b>" + total + "</b> = " + byCat.join(" + ") +
          "<br><span style='color:#c4622d'><strong>「给东西分类」是低年级，「给数据分类」是更高阶</strong>——" +
          "后者要对<strong>数字</strong>分类（比如按分数段、按身高段），这是数据意识的进阶。</span>";
    }
    on("cl-mode", "input", go);
    go();
  }

  /* ======================================================================
     ② 三种统计图 —— 同一份数据的三种看法
     ====================================================================== */
  function chartDemo() {
    const host = $("ch-demo"); if (!host) return;
    const vis = $("ch-vis"), out = $("ch-out");
    const type = $("ch-type");
    const L = DATA.label, V = DATA.v;
    const max = Math.max(...V), sum = V.reduce((a, b) => a + b, 0);

    function go() {
      const t = type.value;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 270", width: "100%" });
      const x0 = 70, y0 = 40, W = 520, H = 170;

      if (t === "0") {
        // 条形图
        svg.appendChild(E("line", { x1: x0, y1: y0, x2: x0, y2: y0 + H, stroke: "#2b2723", "stroke-width": 2 }));
        svg.appendChild(E("line", { x1: x0, y1: y0 + H, x2: x0 + W, y2: y0 + H, stroke: "#2b2723", "stroke-width": 2 }));
        V.forEach((v, i) => {
          const bh = (v / max) * H, bx = x0 + 30 + i * 120, by = y0 + H - bh;
          svg.appendChild(E("rect", { x: bx, y: by, width: 62, height: bh, fill: C[i], opacity: .82, rx: 3 }));
          svg.appendChild(T(bx + 31, by - 8, v, { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: C[i] }));
          svg.appendChild(T(bx + 31, y0 + H + 20, L[i], { "text-anchor": "middle", "font-size": 12.5, fill: "#5c554d" }));
        });
      } else if (t === "1") {
        // 折线图
        svg.appendChild(E("line", { x1: x0, y1: y0, x2: x0, y2: y0 + H, stroke: "#2b2723", "stroke-width": 2 }));
        svg.appendChild(E("line", { x1: x0, y1: y0 + H, x2: x0 + W, y2: y0 + H, stroke: "#2b2723", "stroke-width": 2 }));
        const pts = V.map((v, i) => [x0 + 50 + i * 130, y0 + H - (v / max) * H]);
        svg.appendChild(E("polyline", {
          points: pts.map((p) => p.join(",")).join(" "), fill: "none",
          stroke: "#c4622d", "stroke-width": 3, "stroke-linejoin": "round",
        }));
        pts.forEach((p, i) => {
          svg.appendChild(E("circle", { cx: p[0], cy: p[1], r: 6, fill: C[i] }));
          svg.appendChild(T(p[0], p[1] - 14, V[i], { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: C[i] }));
          svg.appendChild(T(p[0], y0 + H + 20, L[i], { "text-anchor": "middle", "font-size": 12.5, fill: "#5c554d" }));
        });
      } else {
        // 扇形图
        const cx = 200, cy = 140, r = 88;
        let a0 = -Math.PI / 2;
        V.forEach((v, i) => {
          const a1 = a0 + (v / sum) * Math.PI * 2;
          const large = (v / sum) > 0.5 ? 1 : 0;
          svg.appendChild(E("path", {
            d: `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`,
            fill: C[i], opacity: .82, stroke: "#fff", "stroke-width": 2,
          }));
          const am = (a0 + a1) / 2;
          svg.appendChild(T(cx + r * 0.62 * Math.cos(am), cy + r * 0.62 * Math.sin(am) + 5,
            Math.round((v / sum) * 100) + "%", { "text-anchor": "middle", "font-size": 12.5, "font-weight": 700, fill: "#fff" }));
          // 图例
          const ly = 70 + i * 26;
          svg.appendChild(E("rect", { x: 400, y: ly, width: 14, height: 14, rx: 3, fill: C[i] }));
          svg.appendChild(T(422, ly + 12, L[i] + "：" + v + " 人（" + Math.round((v / sum) * 100) + "%）", { "font-size": 12.5, fill: "#2b2723" }));
          a0 = a1;
        });
      }
      vis.appendChild(svg);

      const NAMES = { "0": "条形统计图", "1": "折线统计图", "2": "扇形统计图" };
      const ASK = { "0": "<b>比大小</b>：谁最多、谁最少、差多少", "1": "<b>看趋势</b>：怎么变的、涨还是跌", "2": "<b>看占比</b>：每一类占整体的百分之几" };
      out.innerHTML = "<b>" + NAMES[t] + "</b>　——　它能回答的问题是：" + ASK[t] + "。<br>" +
        "<span style='color:#c4622d'><strong>三张图用的是同一份数据</strong>（总数 " + sum + "），<br>" +
        "<strong>选哪张图不取决于数据，取决于「你想看什么」。</strong></span>";
    }
    on("ch-type", "input", go);
    go();
  }

  /* ======================================================================
     ③ 平均数 —— 本质是「保持总量不变的等效替代」
     ====================================================================== */
  function avgDemo() {
    const host = $("av-demo"); if (!host) return;
    const vis = $("av-vis"), out = $("av-out");
    const r = $("av-r"), rv = $("av-rv");
    // 4 个同学的身高
    let H = [140, 150, 145, 155];

    function go() {
      const d = +r.value;
      rv.textContent = (d > 0 ? "+" : "") + d;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 250", width: "100%" });
      const y0 = 60, BH = 150, base = y0 + BH;
      const sum = H.reduce((a, b) => a + b, 0);
      const avg = sum / H.length;

      H.forEach((h, i) => {
        const x = 80 + i * 90;
        const hh = (h - 120) / 50 * BH;
        svg.appendChild(E("rect", { x, y: base - hh, width: 52, height: hh, fill: C[i], opacity: .8, rx: 4 }));
        svg.appendChild(T(x + 26, base - hh - 8, h, { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: C[i] }));
        svg.appendChild(T(x + 26, base + 20, "小" + "一二三四"[i], { "text-anchor": "middle", "font-size": 12.5, fill: "#5c554d" }));
      });
      // 平均线
      const ay = base - (avg - 120) / 50 * BH;
      svg.appendChild(E("line", { x1: 40, y1: ay, x2: 560, y2: ay, stroke: "#c4622d", "stroke-width": 2.4, "stroke-dasharray": "7 4" }));
      svg.appendChild(T(566, ay + 5, "平均 " + avg, { "font-size": 13, "font-weight": 700, fill: "#c4622d" }));

      const bmax = Math.max(150, base);
      svg.appendChild(E("line", { x1: 40, y1: base, x2: 560, y2: base, stroke: "#2b2723", "stroke-width": 2 }));
      svg.appendChild(T(300, bmax + 34, "总数 = " + sum + "（cm）　÷ 4 人 = " + avg + "（cm）", { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#2f6b52" }));
      vis.appendChild(svg);

      out.innerHTML =
        "四个人身高：<b>" + H.join("、") + "</b> cm，总和 <b>" + sum + "</b>。<br>" +
        "平均数 = " + sum + " ÷ 4 = <b>" + avg + "</b> cm。<br>" +
        "<span style='color:#c4622d'><strong>平均数是「保持总量不变的等效替代」</strong>——<br>" +
        "它<strong>不代表每个人都一样高</strong>（没有一个人正好 " + avg + "），<br>" +
        "它只保证：<strong>用这个数代替所有数，总量一点没变</strong>。这就是平均数的全部意义。</span>" +
        "<br><br>⚠️ 注意：<strong>拖动滑块改变了某个人的身高，总数也变了</strong>——" +
          "所以<strong>只要有人动了，平均数就一定变</strong>。这正是「平均数是替代，不是真实」的表现。";
    }
    on("av-r", "input", go);
    // 滑块：调整第一个人的身高
    r.addEventListener("input", () => { H[0] = 135 + (+r.value); go(); });
    go();
  }

  /* ======================================================================
     ④ 百分数 / 可能性
     ====================================================================== */
  function percentDemo() {
    const host = $("pc-demo"); if (!host) return;
    const vis = $("pc-vis"), out = $("pc-out");
    const r = $("pc-r"), rv = $("pc-rv");
    const total = 50;
    function go() {
      const part = +r.value;
      rv.textContent = part + " 人";
      const pct = (part / total) * 100;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 320", width: "100%" });
      // 百格图
      const x0 = 40, y0 = 40, cs = 22;
      for (let i = 0; i < total; i++) {
        const r0 = Math.floor(i / 10), c0 = i % 10;
        const on = i < part;
        svg.appendChild(E("rect", {
          x: x0 + c0 * cs, y: y0 + r0 * cs, width: cs - 3, height: cs - 3,
          fill: on ? "#2f6b52" : "#f3efe7", opacity: on ? .85 : 1, rx: 2,
        }));
      }
      // 标注
      svg.appendChild(T(x0 + 245, y0 + 30, "总共 " + total + " 人", { "font-size": 13, fill: "#5c554d" }));
      svg.appendChild(T(x0 + 245, y0 + 60, "其中 " + part + " 人戴眼镜", { "font-size": 13, fill: "#2f6b52", "font-weight": 600 }));
      svg.appendChild(T(x0 + 245, y0 + 95, pct.toFixed(1) + "%", { "font-size": 30, "font-weight": 700, fill: "#c4622d" }));
      svg.appendChild(T(x0 + 245, y0 + 122, "= " + part + " ÷ " + total, { "font-size": 13, fill: "#8d857a" }));
      svg.appendChild(T(x0, y0 + 250 - 12, "每个小方块 = 1 人（共 50 格）", { "font-size": 12, fill: "#8d857a" }));
      vis.appendChild(svg);
      out.innerHTML =
        "<b>" + part + " ÷ " + total + " = " + (part / total) + " = <b>" + pct.toFixed(1) + "%</b></b><br>" +
        "<span style='color:#c4622d'><strong>百分数表示「一个部分是整体的百分之几」</strong>——<br>" +
        "它<strong>不写单位</strong>（因为它已经是「每 100 份」的意思了）。<br>" +
        "<strong>关键：分母不变，比值才可比</strong>。所以「班里 40% 的人戴眼镜」这句话，<br>" +
        "<strong>换个班就得重新数</strong>——因为「整体」换了。</span>";
    }
    on("pc-r", "input", go);
    go();
  }

  function possibleDemo() {
    const host = $("ps-demo"); if (!host) return;
    const vis = $("ps-vis"), out = $("ps-out");
    const mode = $("ps-mode");
    function go() {
      const m = mode.value;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 220", width: "100%" });
      if (m === "0") {
        // 必然 / 不可能 / 可能
        const boxes = [
          { t: "一定", s: "明天太阳从东边升起", ok: true, c: "#2f6b52" },
          { t: "可能", s: "抛硬币，正面朝上", ok: null, c: "#c4622d" },
          { t: "不可能", s: "太阳从西边升起", ok: false, c: "#c4622d" },
        ];
        boxes.forEach((b, i) => {
          const x = 40 + i * 200;
          svg.appendChild(E("rect", { x, y: 40, width: 170, height: 110, rx: 12, fill: b.c, opacity: .12, stroke: b.c, "stroke-width": 2 }));
          svg.appendChild(T(x + 85, 78, b.t, { "text-anchor": "middle", "font-size": 20, "font-weight": 700, fill: b.c }));
          svg.appendChild(T(x + 85, 108, b.s, { "text-anchor": "middle", "font-size": 12.5, fill: "#2b2723" }));
          svg.appendChild(T(x + 85, 136, b.ok === false ? "✗ 不可能发生" : b.ok === true ? "✓ 一定会发生" : "? 有可能", { "text-anchor": "middle", "font-size": 12, fill: b.c }));
        });
      } else {
        // 摸球
        const balls = [["红", "#c4622d", 5], ["蓝", "#4a5b8c", 3], ["绿", "#2f6b52", 2]];
        const tot = balls.reduce((a, b) => a + b[2], 0);
        let cx = 60;
        balls.forEach(([nm, c, n]) => {
          for (let i = 0; i < n; i++) {
            svg.appendChild(E("circle", { cx, cy: 90, r: 15, fill: c, opacity: .85 }));
            cx += 36;
          }
          svg.appendChild(T(cx - n * 18, 128, nm + " " + n + " 个", { "text-anchor": "middle", "font-size": 12.5, fill: c, "font-weight": 600 }));
        });
        svg.appendChild(T(320, 176, "一共 " + tot + " 个球：红 5、蓝 3、绿 2", { "text-anchor": "middle", "font-size": 13, fill: "#5c554d" }));
        svg.appendChild(T(320, 200, "摸到红球的可能性最大，但<tspan/>不是一定——除非「只放红球」", { "text-anchor": "middle", "font-size": 12.5, fill: "#c4622d" }));
      }
      vis.appendChild(svg);
      out.innerHTML = m === "0"
        ? "<b>可能性分三种：一定、可能、不可能。</b><br>" +
          "「太阳从西边升起」——<b>不可能</b>（在日常生活范围内）<br>" +
          "「抛硬币正面朝上」——<b>可能</b>（有红有蓝，不确定）<br>" +
          "「明天太阳从东边升起」——<b>一定</b>会发生（这是必然）<br>" +
          "<span style='color:#c4622d'><strong>孩子常犯的错：把「可能」说成「一定」</strong>——" +
          "因为「大多数情况下会这样」就以为「必然」。<br>关键是问一句：<strong>有没有可能不这样？</strong></span>"
        : "<b>可能性的大小 = 这一类的个数 ÷ 总个数</b><br>" +
          "红 5/10 > 蓝 3/10 > 绿 2/10，所以<strong>摸到红球可能性最大</strong>。<br>" +
          "<span style='color:#c4622d'><strong>「可能性大」不等于「一定」</strong>——<br>" +
          "只要有第二种球在，就有摸不到红球的可能。<strong>「一定」只有一个条件：全是它。</strong></span>";
    }
    on("ps-mode", "input", go);
    go();
  }

  function boot() { classifyDemo(); chartDemo(); avgDemo(); percentDemo(); possibleDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
