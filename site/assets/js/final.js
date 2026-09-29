/* ==========================================================================
   final.js —— B9 量的单位 / B13 找规律 / B1 数的位值与进退位
   ---------------------------------------------------------------------------
   三条主张：
     量的单位：单位不是规定，是人类的身体（十指）给的起点；时间是唯一的 60 进制
     找规律：规律不在数字里，在「下一个是怎么来的」这个动作里
     进退位：满十进一 = 位值制的必然结果，不是口诀
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 13, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };

  /* ======================================================================
     ① 时钟 —— 为什么时间是 60 进制
     ====================================================================== */
  function clockDemo() {
    const host = $("ck-demo"); if (!host) return;
    const vis = $("ck-vis"), out = $("ck-out");
    const r = $("ck-r"), rv = $("ck-rv");
    const mode = $("ck-mode");

    function go() {
      const h = +r.value, m = +mode.value;
      rv.textContent = h + " 时 " + m + " 分";
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 300", width: "100%" });
      const cx = 180, cy = 150, R = 118;

      // 表盘
      svg.appendChild(E("circle", { cx, cy, r: R, fill: "#faf7f2", stroke: "#2b2723", "stroke-width": 3 }));
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const big = i % 5 === 0;
        const r1 = big ? R - 20 : R - 11, r2 = R - 6;
        svg.appendChild(E("line", {
          x1: cx + r1 * Math.cos(a), y1: cy + r1 * Math.sin(a),
          x2: cx + r2 * Math.cos(a), y2: cy + r2 * Math.sin(a),
          stroke: big ? "#2b2723" : "#b5aca0", "stroke-width": big ? 2.4 : 1.2,
        }));
        if (big) svg.appendChild(T(cx + (R - 36) * Math.cos(a), cy + (R - 36) * Math.sin(a) + 5, i / 5,
          { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#2b2723" }));
      }
      // 时针
      const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
      svg.appendChild(E("line", {
        x1: cx - 20 * Math.cos(ha), y1: cy - 20 * Math.sin(ha),
        x2: cx + 52 * Math.cos(ha), y2: cy + 52 * Math.sin(ha),
        stroke: "#2b2723", "stroke-width": 6, "stroke-linecap": "round",
      }));
      // 分针
      const ma = m / 60 * Math.PI * 2 - Math.PI / 2;
      svg.appendChild(E("line", {
        x1: cx - 24 * Math.cos(ma), y1: cy - 24 * Math.sin(ma),
        x2: cx + 88 * Math.cos(ma), y2: cy + 88 * Math.sin(ma),
        stroke: "#c4622d", "stroke-width": 3.4, "stroke-linecap": "round",
      }));
      svg.appendChild(E("circle", { cx, cy, r: 6, fill: "#2b2723" }));

      // 右侧说明：60 进制
      const bx = 380;
      svg.appendChild(T(bx, 44, "表盘上一共", { "font-size": 14, fill: "#5c554d" }));
      svg.appendChild(T(bx, 76, "60", { "font-size": 40, "font-weight": 700, fill: "#c4622d", "font-family": "ui-monospace, monospace" }));
      svg.appendChild(T(bx, 100, "个小格", { "font-size": 14, fill: "#5c554d" }));
      svg.appendChild(T(bx, 132, "12 个数字，每个之间 5 格", { "font-size": 13, fill: "#8d857a" }));
      svg.appendChild(T(bx, 154, "5 × 12 = 60", { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));
      // 进位演示
      const gx = bx, gy = 190;
      for (let i = 0; i < 59; i++) {
        svg.appendChild(E("rect", { x: gx + (i % 15) * 15, y: gy + Math.floor(i / 15) * 15, width: 11, height: 11, fill: "#e8f1ec", rx: 2 }));
      }
      svg.appendChild(E("rect", { x: gx + 14 * 15, y: gy + 3 * 15, width: 11, height: 11, fill: "#c4622d", rx: 2 }));
      svg.appendChild(T(gx, gy + 4 * 15 + 22, "60 个一格 → 满 60 进 1 小时（不是满 10）", { "font-size": 12.5, fill: "#c4622d", "font-weight": 600 }));
      vis.appendChild(svg);

      out.innerHTML = "现在显示 <b>" + h + " 时 " + m + " 分</b>。<br>" +
        "<span style='color:#c4622d'><strong>时间用的是 60 进制</strong>——1 小时 = 60 分，1 分 = 60 秒。<br>" +
        "而<strong>数数、长度、质量用的是 10 进制</strong>（满 10 进 1）。<br>" +
        "<strong>「满 60 进 1」是唯一打破十进制的规则</strong>，所以时间计算最容易错——<br>" +
        "孩子会下意识按满 10 进 1 去算分钟和秒。</span>";
    }
    on("ck-r", "input", go); on("ck-mode", "input", go);
    rv.textContent = r.value + " 时 " + mode.value + " 分";
    go();
  }

  /* ======================================================================
     ② 常见量换算 —— 所有换算都是同一个动作
     ====================================================================== */
  function commonDemo() {
    const host = $("cm-demo"); if (!host) return;
    const vis = $("cm-vis"), out = $("cm-out");
    const sel = $("cm-sel");
    const GROUPS = {
      "0": { n: "时间", base: "1 时 = 60 分", chain: [["时", 1], ["分", 60], ["秒", 3600]], u: ["时", "分", "秒"] },
      "1": { n: "人民币", base: "1 元 = 10 角 = 100 分", chain: [["元", 1], ["角", 10], ["分", 100]], u: ["元", "角", "分"] },
      "2": { n: "质量", base: "1 千克 = 1000 克", chain: [["吨", 1000], ["千克", 1], ["克", 0.001]], u: ["吨", "千克", "克"] },
    };
    function go() {
      const g = GROUPS[sel.value];
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 250", width: "100%" });
      g.chain.forEach(([u, f], i) => {
        const y = 50 + i * 62, w = 60 + (f >= 1 ? Math.log10(f + 1) * 70 : 40);
        svg.appendChild(E("rect", { x: 50, y, width: w, height: 36, rx: 7, fill: "#2f6b52", opacity: .18, stroke: "#2f6b52", "stroke-width": 2 }));
        svg.appendChild(T(60, y + 24, "1 " + u, { "font-size": 15, "font-weight": 700, fill: "#2f6b52" }));
        if (i < g.chain.length - 1) {
          const nx = g.chain[i + 1];
          const mult = f / nx[1];
          svg.appendChild(T(50 + w + 14, y + 24, "1 " + u + " = " + (mult >= 1 ? mult : 1 / mult) + " " + nx[0], { "font-size": 14, "font-weight": 700, fill: "#c4622d" }));
        }
        svg.appendChild(T(470, y + 24, "这是「换单位」", { "font-size": 12, fill: "#8d857a" }));
      });
      svg.appendChild(T(50, 236, g.base + "　（换算就是「同一个量换一种说法」）", { "font-size": 14, "font-weight": 600, fill: "#2b2723" }));
      vis.appendChild(svg);
      out.innerHTML = "<b>" + g.n + "：</b>" + g.base + "<br>" +
        "<span style='color:#c4622d'><strong>所有常见量的换算，动作都只有一个——「换单位」</strong>：<br>" +
        "大单位换小单位 <strong>×</strong>（1 时 = 60 分），小单位换大单位 <strong>÷</strong>。<br>" +
        "<strong>单位不是规定，是人类为了「换算时用整数」达成的公共约定</strong>——<br>" +
        "所以<strong>1 时必须等于 60 分</strong>，这样时钟才分得均匀。</span>";
    }
    on("cm-sel", "input", go);
    go();
  }

  /* ======================================================================
     ③ 找规律 —— 关键不是「下一个是什么」，是「动作是什么」
     ====================================================================== */
  function patternDemo() {
    const host = $("pt-demo"); if (!host) return;
    const vis = $("pt-vis"), out = $("pt-out");
    const r = $("pt-r"), rv = $("pt-rv");
    const mode = $("pt-mode");

    function go() {
      const step = +r.value, m = mode.value;
      rv.textContent = step;
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 230", width: "100%" });
      const N = 7, gap = 78, x0 = 45, y0 = 60;
      const count = (i) => i < N ? 1 + i * step : 0;

      for (let i = 0; i < N; i++) {
        const c = count(i);
        const x = x0 + i * gap;
        if (m === "0") {
          // 点阵/数量
          for (let k = 0; k < c; k++) {
            const px = x + (k % 3) * 16, py = y0 + Math.floor(k / 3) * 16;
            svg.appendChild(E("circle", { cx: px, cy: py, r: 6, fill: "#2f6b52" }));
          }
        } else {
          // 形状：正 n 边形
          const sides = c, R = 30, pts = [];
          for (let k = 0; k < sides; k++) {
            const a = (k / sides) * Math.PI * 2 - Math.PI / 2;
            pts.push((x + 26 + R * Math.cos(a)) + "," + (y0 + R + Math.sin(a)));
          }
          svg.appendChild(E("polygon", { points: pts.join(" "), fill: "#c4622d", opacity: .72, stroke: "#a0492f", "stroke-width": 2 }));
        }
        svg.appendChild(T(x + 26, y0 + 120, "第" + (i + 1) + "个", { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
        svg.appendChild(T(x + 26, y0 + 138, String(c), { "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: "#2f6b52", "font-family": "ui-monospace, monospace" }));
        if (i < N - 1) {
          svg.appendChild(T(x + 52, y0 + 16, "+" + step, { "text-anchor": "middle", "font-size": 12, fill: "#c4622d", "font-weight": 600 }));
        } else {
          svg.appendChild(T(x + 26, y0 + 166, "?  问「下一个」", { "text-anchor": "middle", "font-size": 12.5, fill: "#c4622d", "font-weight": 700 }));
        }
      }
      vis.appendChild(svg);

      const nxt = 1 + (N - 1 + 1 - 1) * step;
      out.innerHTML =
        "第 1 个是 <b>1</b>，第 2 个 <b>" + (1 + step) + "</b>，第 3 个 <b>" + (1 + 2 * step) + "</b> …… 第 7 个 <b>" + (1 + 6 * step) + "</b><br>" +
        "下一个是 <b>" + (1 + 7 * step) + "</b>。<br>" +
        "<span style='color:#c4622d'><strong>关键不是记住「下一个是几」，而是发现「动作是每次 +" + step + "」。</strong><br>" +
        "找到<b>动作</b>，下一个可以无限推下去；只背<b>结果</b>，换个题型就断了。<br>" +
        "这就是<a href='../pillar/structure.html'>结构柱</a>说的：<strong>找的是结构，不是结果。</strong></span>";
    }
    on("pt-r", "input", go); on("pt-mode", "input", go);
    go();
  }

  /* ======================================================================
     ④ 进位加法 —— 满十进一 = 位值制的必然
     ====================================================================== */
  function carryDemo() {
    const host = $("cr-demo"); if (!host) return;
    const vis = $("cr-vis"), out = $("cr-out");
    const a = $("cr-a"), b = $("cr-b");
    const av = $("cr-av"), bv = $("cr-bv");
    const A = 47, B = 28;

    function go() {
      av.textContent = a.value; bv.textContent = b.value;
      const x = +a.value, y = +b.value;
      const units = (x % 10) + (y % 10);
      const carry = units >= 10 ? 1 : 0;
      const tens = Math.floor(x / 10) + Math.floor(y / 10) + carry;
      const res = x + y;

      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 250", width: "100%" });
      const bx = 80, bw = 20, gap = 5, y0 = 45;

      // 第一行 x
      for (let i = 0; i < Math.floor(x / 10); i++)
        svg.appendChild(E("rect", { x: bx + i * bw, y: y0, width: bw - 4, height: 26, fill: "#2f6b52", rx: 3 }));
      for (let i = 0; i < x % 10; i++)
        svg.appendChild(E("rect", { x: bx + (Math.floor(x / 10)) * bw + gap + i * bw, y: y0, width: bw - 4, height: 26, fill: "#2f6b52", rx: 3 }));
      svg.appendChild(T(bx - 12, y0 + 19, x, { "text-anchor": "end", "font-size": 19, "font-weight": 700, "font-family": "ui-monospace, monospace" }));

      // 第二行 y
      const y0b = 88;
      for (let i = 0; i < Math.floor(y / 10); i++)
        svg.appendChild(E("rect", { x: bx + i * bw, y: y0b, width: bw - 4, height: 26, fill: "#c4622d", rx: 3 }));
      for (let i = 0; i < y % 10; i++)
        svg.appendChild(E("rect", { x: bx + (Math.floor(y / 10)) * bw + gap + i * bw, y: y0b, width: bw - 4, height: 26, fill: "#c4622d", rx: 3 }));
      svg.appendChild(T(bx - 12, y0b + 19, y, { "text-anchor": "end", "font-size": 19, "font-weight": 700, "font-family": "ui-monospace, monospace" }));

      // 加号和横线
      svg.appendChild(T(bx - 40, y0b + 19, "+", { "text-anchor": "end", "font-size": 22, "font-weight": 700 }));
      const lineY = 132;
      svg.appendChild(E("line", { x1: bx - 46, y1: lineY, x2: bx + 300, y2: lineY, stroke: "#2b2723", "stroke-width": 2.4 }));

      // 结果
      const res0 = y0 + 152;
      const rT = Math.floor(res / 10), rO = res % 10;
      for (let i = 0; i < rT; i++)
        svg.appendChild(E("rect", { x: bx + i * bw, y: res0, width: bw - 4, height: 26, fill: "#6b4a7a", rx: 3 }));
      for (let i = 0; i < rO; i++)
        svg.appendChild(E("rect", { x: bx + rT * bw + gap + i * bw, y: res0, width: bw - 4, height: 26, fill: "#6b4a7a", rx: 3 }));
      svg.appendChild(T(bx - 12, res0 + 19, res, { "text-anchor": "end", "font-size": 19, "font-weight": 700, fill: "#6b4a7a", "font-family": "ui-monospace, monospace" }));

      // 说明
      const sx = 400;
      svg.appendChild(T(sx, 60, "① 个位先合：", { "font-size": 13.5, "font-weight": 700, fill: "#5c554d" }));
      svg.appendChild(T(sx, 82, (x % 10) + " + " + (y % 10) + " = " + units, { "font-size": 15, "font-weight": 700, fill: "#c4622d" }));
      if (carry) {
        svg.appendChild(T(sx, 110, "满 10 → 进 1 个十", { "font-size": 13.5, "font-weight": 700, fill: "#c4622d" }));
        svg.appendChild(T(sx, 132, "写 " + (units % 10) + "，向十位进 1", { "font-size": 12.5, fill: "#8d857a" }));
      } else {
        svg.appendChild(T(sx, 110, "不满 10 → 不用进位", { "font-size": 13.5, fill: "#2f6b52", "font-weight": 600 }));
      }
      svg.appendChild(T(sx, 164, "② 十位再合：", { "font-size": 13.5, "font-weight": 700, fill: "#5c554d" }));
      svg.appendChild(T(sx, 186, Math.floor(x / 10) + " + " + Math.floor(y / 10) + (carry ? " + 1（进位的）" : ""), { "font-size": 14, fill: "#2b2723" }));
      vis.appendChild(svg);

      out.innerHTML =
        "<b>" + x + " + " + y + " = " + res + "</b><br>" +
        (carry
          ? "个位：<b>" + (x % 10) + " + " + (y % 10) + " = " + units + "</b>，<b>满 10 了</b>，个位写 " + (units % 10) + "，向十位进 1。<br>"
            + "十位：<b>" + Math.floor(x / 10) + " + " + Math.floor(y / 10) + " + 1（进位的）= " + tens + "</b>。<br>"
          : "个位：<b>" + (x % 10) + " + " + (y % 10) + " = " + units + "</b>，不满 10，不用进位。<br>") +
        "<span style='color:#c4622d'><strong>「满十进一」不是口诀，是位值制的必然</strong>：<br>" +
        "因为<strong>个位只能表示 0~9，装到第 10 个就装不下了</strong>。<br>" +
        "那第 10 个是「十」，<strong>只能送到十位去</strong>——所以必须<strong>先合并，再看够不够 10</strong>，<br>" +
        "不能反过来先分再合。</span>";
    }
    on("cr-a", "input", go); on("cr-b", "input", go);
    go();
  }

  /* ======================================================================
     ⑤ 退位减法 —— 10 个一凑成 1 个十
     ====================================================================== */
  function borrowDemo() {
    const host = $("bw-demo"); if (!host) return;
    const vis = $("bw-vis"), out = $("bw-out");
    const a = $("bw-a"), b = $("bw-b");
    const av = $("bw-av"), bv = $("bw-bv");

    function go() {
      const x = +a.value, y = +b.value;
      av.textContent = x; bv.textContent = y;
      vis.innerHTML = "";

      // 退位是「不够减时向高位借」，前提是被减数 >= 减数。
      // 少了这道守卫，20 − 48 会画出「十位 1 − 4 = −3」——小学阶段不该出现负数借位。
      if (x < y) {
        const svg0 = E("svg", { viewBox: "0 0 640 250", width: "100%" });
        const t1 = T(320, 96, "这组数还不用退位", { "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: "#c4622d" });
        const t2 = T(320, 128, "被减数 " + x + " 比减数 " + y + " 小", { "text-anchor": "middle", "font-size": 14, fill: "#5c554d" });
        const t3 = T(320, 152, "退位是「个位不够减，向十位借一个十」——只有够减的时候才用得上", { "text-anchor": "middle", "font-size": 13.5, fill: "#8d857a" });
        const t4 = T(320, 176, "把被减数调大到 " + y + " 以上再来试", { "text-anchor": "middle", "font-size": 13, fill: "#8d857a" });
        [t1, t2, t3, t4].forEach((t) => svg0.appendChild(t));
        vis.appendChild(svg0);
        out.innerHTML =
          "<b>" + x + " − " + y + "</b> 暂时不用退位。<br>" +
          "<strong>被减数（" + x + "）比减数（" + y + "）小</strong>，这不是退位能解决的。<br>" +
          "<span style='color:#c4622d'><strong>退位的定义是「个位不够减，从十位借 1 个十」。</strong>" +
          "够减才需要退位；不够减属于「不够减就换更大的被减数」，两回事。</span>";
        return;
      }

      const need = x % 10 < y % 10;
      const res = x - y;
      const svg = E("svg", { viewBox: "0 0 640 250", width: "100%" });
      const bx = 80, bw = 20, gap = 5, y0 = 45;

      // 被减数
      for (let i = 0; i < Math.floor(x / 10); i++)
        svg.appendChild(E("rect", { x: bx + i * bw, y: y0, width: bw - 4, height: 26, fill: "#2f6b52", rx: 3 }));
      for (let i = 0; i < x % 10; i++)
        svg.appendChild(E("rect", { x: bx + Math.floor(x / 10) * bw + gap + i * bw, y: y0, width: bw - 4, height: 26, fill: "#2f6b52", rx: 3 }));
      svg.appendChild(T(bx - 12, y0 + 19, x, { "text-anchor": "end", "font-size": 19, "font-weight": 700, "font-family": "ui-monospace, monospace" }));

      // 减数
      const y0b = 88;
      for (let i = 0; i < Math.floor(y / 10); i++)
        svg.appendChild(E("rect", { x: bx + i * bw, y: y0b, width: bw - 4, height: 26, fill: "#c4622d", rx: 3 }));
      for (let i = 0; i < y % 10; i++)
        svg.appendChild(E("rect", { x: bx + Math.floor(y / 10) * bw + gap + i * bw, y: y0b, width: bw - 4, height: 26, fill: "#c4622d", rx: 3 }));
      svg.appendChild(T(bx - 12, y0b + 19, y, { "text-anchor": "end", "font-size": 19, "font-weight": 700, "font-family": "ui-monospace, monospace" }));
      svg.appendChild(T(bx - 40, y0b + 19, "−", { "text-anchor": "end", "font-size": 22, "font-weight": 700 }));
      const lineY = 132;
      svg.appendChild(E("line", { x1: bx - 46, y1: lineY, x2: bx + 300, y2: lineY, stroke: "#2b2723", "stroke-width": 2.4 }));

      // 退位标记
      if (need) {
        const dx = bx + Math.floor(x / 10) * bw + gap / 2;
        svg.appendChild(E("path", { d: `M${dx} ${y0 - 4} q14 8 0 16 q-14 8 0 16`, fill: "none", stroke: "#c4622d", "stroke-width": 2 }));
        svg.appendChild(T(dx, y0 - 14, "退 1", { "text-anchor": "middle", "font-size": 11, fill: "#c4622d", "font-weight": 700 }));
        svg.appendChild(E("line", { x1: dx, y1: y0 + 34, x2: dx, y2: y0b - 6, stroke: "#c4622d", "stroke-width": 1.4, "stroke-dasharray": "3 3" }));
      }

      // 结果
      const res0 = y0 + 152;
      const rT = Math.floor(res / 10), rO = res % 10;
      for (let i = 0; i < rT; i++)
        svg.appendChild(E("rect", { x: bx + i * bw, y: res0, width: bw - 4, height: 26, fill: "#6b4a7a", rx: 3 }));
      for (let i = 0; i < rO; i++)
        svg.appendChild(E("rect", { x: bx + rT * bw + gap + i * bw, y: res0, width: bw - 4, height: 26, fill: "#6b4a7a", rx: 3 }));
      svg.appendChild(T(bx - 12, res0 + 19, res, { "text-anchor": "end", "font-size": 19, "font-weight": 700, fill: "#6b4a7a", "font-family": "ui-monospace, monospace" }));

      const sx = 400;
      svg.appendChild(T(sx, 60, "个位：", { "font-size": 13.5, "font-weight": 700, fill: "#5c554d" }));
      svg.appendChild(T(sx, 82, (x % 10) + " − " + (y % 10) + " = " + (x % 10 - y % 10), { "font-size": 15, "font-weight": 700, fill: "#c4622d" }));
      svg.appendChild(T(sx, 110, need ? "个位不够减 → 退位" : "够减，不用退位", { "font-size": 13.5, "font-weight": 700, fill: need ? "#c4622d" : "#2f6b52" }));
      svg.appendChild(T(sx, 164, "十位：", { "font-size": 13.5, "font-weight": 700, fill: "#5c554d" }));
      svg.appendChild(T(sx, 186, Math.floor(x / 10) + " − " + Math.floor(y / 10) + (need ? " − 1（退位的）" : ""), { "font-size": 14, fill: "#2b2723" }));
      vis.appendChild(svg);

      out.innerHTML = "<b>" + x + " − " + y + " = " + res + "</b><br>" +
        (need
          ? "个位：<b>" + (x % 10) + " − " + (y % 10) + "</b> 不够减。<b>退位</b>：从十位借 1 个十，<br>" +
            "拆成 10 个一 —— 于是个位变成 <b>" + (x % 10 + 10) + "</b>，<b>" + (x % 10 + 10) + " − " + (y % 10) + " = " + (x % 10 + 10 - y % 10) + "</b>。<br>" +
            "十位同时<strong>少 1 个</strong>：<b>" + (Math.floor(x / 10) - 1) + " − " + Math.floor(y / 10) + " = " + rT + "</b>。<br>"
          : "个位：<b>" + (x % 10) + " − " + (y % 10) + " = " + (x % 10 - y % 10) + "</b>，够减，<strong>不用退位</strong>。<br>") +
        "<span style='color:#c4622d'><strong>「退位」不是规定，是「1 个十 = 10 个一」在倒着用</strong>。<br>" +
        "进位是<strong>10 个一 → 1 个十</strong>，退位就是它的<strong>逆过程</strong>。<br>" +
        "孩子把<strong>借的那个十记得扣掉</strong>，就不会算错。</span>";
    }
    on("bw-a", "input", go); on("bw-b", "input", go);
    go();
  }

  /* ======================================================================
     ⑥ 数的认识 —— 位值制在「大数」上的延伸
     ====================================================================== */
  function bigNumDemo() {
    const host = $("bn-demo"); if (!host) return;
    const vis = $("bn-vis"), out = $("bn-out");
    const mode = $("bn-mode");
    const CASES = {
      0: { n: "407", t: "四百零七" },
      1: { n: "10000", t: "一万" },
      2: { n: "100000000", t: "一亿" },
      3: { n: "3050700", t: "三百零五万零七百" },
    };
    function go() {
      const c = CASES[mode.value];
      vis.innerHTML = "";
      const svg = E("svg", { viewBox: "0 0 640 220", width: "100%" });
      const units = ["亿", "千万", "百万", "十万", "万", "千", "百", "十", "一"];
      const s = c.n.padStart(units.length, " ");
      const x0 = 24, cw = 54, y0 = 60;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const isFirst = ch.trim() !== "";
        svg.appendChild(E("rect", {
          x: x0 + i * cw, y: y0, width: cw - 4, height: 40,
          fill: isFirst ? "#e8f1ec" : "#f3efe7", stroke: isFirst ? "#2f6b52" : "#e5ded2", "stroke-width": isFirst ? 2 : 1,
        }));
        svg.appendChild(T(x0 + i * cw + cw / 2 - 2, y0 + 28, ch === " " ? "" : ch, { "text-anchor": "middle", "font-size": 24, "font-weight": 700, "font-family": "ui-monospace, monospace", fill: isFirst ? "#1f4a38" : "#cfc7ba" }));
        svg.appendChild(T(x0 + i * cw + cw / 2 - 2, y0 + 58, units[i] || "", { "text-anchor": "middle", "font-size": 11, fill: "#8d857a" }));
      }
      svg.appendChild(T(x0, y0 + 92, "读作：" + c.t, { "font-size": 17, "font-weight": 700, fill: "#c4622d" }));
      svg.appendChild(T(x0, y0 + 120, "← 每一位乘上它自己代表的大小，再加起来", { "font-size": 13.5, fill: "#5c554d" }));
      vis.appendChild(svg);
      out.innerHTML = "<b>" + c.n + "</b> 读作 <b>" + c.t + "</b>。<br>" +
        "<span style='color:#c4622d'><strong>「万」「亿」不是新单位，只是<strong>十个十位（百、千）打包成一组</strong>。</strong><br>" +
        "孩子读大数读错，几乎都因为<strong>没有从右往左四位一组</strong>。<br>" +
        "<strong>方法是：四位一组，从右往左分：……万、……</strong> 每组第一个数是千，后面是百十个。</span>";
    }
    on("bn-mode", "input", go);
    go();
  }

  function boot() { clockDemo(); commonDemo(); patternDemo(); carryDemo(); borrowDemo(); bigNumDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
