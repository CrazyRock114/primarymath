/* ==========================================================================
   fraction.js —— 分数与小数的图示
   ---------------------------------------------------------------------------
   核心主张：分数和小数是同一件事的两扇门 —— 都是把「计数单位」继续细分。
   这一批刻意与 multiply.js 打通：
     位值制（B1 数柱） → 乘法是打包（B2） → 分数/小数是细分（B3）
   ========================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
  const NS = "http://www.w3.org/2000/svg";
  const E = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const T = (x, y, s, o) => { const t = E("text", Object.assign({ x, y, "font-size": 14, fill: "#2b2723" }, o || {})); t.textContent = s; return t; };
  const CN = ["零","一","二","三","四","五","六","七","八","九","十","十一","十二"];

  /* ======================================================================
     ① 分数从哪里来 —— 先有「一个整体」，再有「平均分」
     ====================================================================== */
  function bornDemo() {
    const host = $("bd-demo"); if (!host) return;
    const vis = $("bd-vis"), out = $("bd-out");
    const d = $("bd-d"), n = $("bd-n");
    const dv = $("bd-dv"), nv = $("bd-nv");

    function go() {
      const D = +d.value, N = +n.value;
      dv.textContent = CN[D] || D; nv.textContent = CN[N] || N;
      // 每次重绘前清空，否则拖动滑块 SVG 节点会无限叠加
      vis.innerHTML = "";
      const W = 640, H = 190;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const shape = +($("bd-shape").value);
      // 画一个"整体"
      const cx = 150, cy = 78, R = 54;
      if (shape === 0) {
        svg.appendChild(E("circle", { cx, cy, r: R, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        for (let i = 0; i < D; i++) {
          const a1 = -Math.PI / 2 + (2 * Math.PI * i) / D;
          const a2 = a1 + (2 * Math.PI) / D;
          if (i < N)
            svg.appendChild(E("path", {
              d: `M${cx},${cy} L${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)} Z`,
              fill: "#2f6b52", opacity: .72,
            }));
        }
      } else if (shape === 1) {
        svg.appendChild(E("rect", { x: cx - 100, y: cy - R, width: 200, height: 2 * R, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        const bw = 200 / D;
        for (let i = 0; i < D; i++)
          if (i < N) svg.appendChild(E("rect", { x: cx - 100 + i * bw, y: cy - R, width: bw, height: 2 * R, fill: "#2f6b52", opacity: .72 }));
      } else {
        svg.appendChild(E("polygon", { points: `${cx},${cy - R} ${cx + 100},${cy + R} ${cx - 100},${cy + R}`, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        for (let i = 0; i < D; i++) {
          const t = i / D;
          if (i === 0) {
            if (N > 0) svg.appendChild(E("polygon", { points: `${cx},${cy - R} ${cx - 100 + 200 / D},${cy + R} ${cx - 100},${cy + R}`, fill: "#2f6b52", opacity: .72 }));
          } else {
            const x1 = cx - 100 + 200 * (i / D), x2 = cx - 100 + 200 * ((i + 1) / D);
            if (i < N) svg.appendChild(E("polygon", { points: `${cx},${cy - R} ${x2},${cy + R} ${x1},${cy + R}`, fill: "#2f6b52", opacity: .72 }));
          }
        }
      }
      vis.appendChild(svg);

      const proper = N < D;
      out.innerHTML =
        "把 <b>1 个整体</b> <strong>平均</strong>分成 <b>" + D + "</b> 份，取其中 <b>" + N + "</b> 份 → " +
        "<b style='color:#2f6b52;font-size:17px'>" + (proper ? N + "/" + D : (N % D) + "/" + D + (N >= D ? "（还有 " + Math.floor(N / D) + " 个整体）" : "")) + "</b><br>" +
        "<strong>分数有两条命根子，缺一个都不成立：</strong><br>" +
        "① <strong>必须有「1 个整体」</strong> —— 没有整体，「一半」无从谈起<br>" +
        "② <strong>必须「平均」分</strong> —— 如果分成 3 大块 2 小块，就<em>不能</em>说「取 2 份是三分之二」<br>" +
        "<span style='color:#c4622d'>孩子最常漏的就是第 ② 条：<strong>不平均，就不是这个分数</strong>。</span>";
    }
    on("bd-d", "input", go); on("bd-n", "input", go); on("bd-shape", "input", go);
    go();
  }

  /* ======================================================================
     ② 数轴：分数和小数是同一件事
     ====================================================================== */
  function axisDemo() {
    const host = $("ax-demo"); if (!host) return;
    const vis = $("ax-vis"), out = $("ax-out");
    const d = $("ax-d"), m = $("ax-m");

    function go() {
      const D = +d.value;
      // 分子必须 <= 分母，否则 v>1 会把红点画到数轴右端之外（viewBox 宽度之外），
      // 画面上根本看不到点，文案却还在讲这个分数。联动钳制。
      m.max = D;
      if (+m.value > D) m.value = D;
      const M = +m.value;   // 分母、分子
      const v = M / D;
      vis.innerHTML = "";
      const W = 640, x0 = 50, x1 = 590, y = 74;
      const svg = E("svg", { viewBox: "0 0 " + W + " 160", width: "100%" });
      // 从 0 到 1
      svg.appendChild(E("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: "#2b2723", "stroke-width": 2.5 }));
      for (let i = 0; i <= 4; i++) {
        const x = x0 + (x1 - x0) * (i / 4);
        svg.appendChild(E("line", { x1: x, y1: y - 7, x2: x, y2: y + 7, stroke: "#cfc7ba", "stroke-width": 1.5 }));
        svg.appendChild(T(x, y - 16, String(i / 4), { "text-anchor": "middle", "font-size": 12, fill: "#8d857a" }));
      }
      // 每一等分
      for (let i = 1; i < D; i++) {
        const x = x0 + (x1 - x0) * (i / D);
        svg.appendChild(E("line", { x1: x, y1: y - 4, x2: x, y2: y + 4, stroke: "#6aa287", "stroke-width": 1.2, opacity: .6 }));
      }
      // 目标点
      const x = x0 + (x1 - x0) * v;
      svg.appendChild(E("circle", { cx: x, cy: y, r: 7, fill: "#c4622d" }));
      // 两种表示
      svg.appendChild(T(x, y - 40, M + "/" + D, { "text-anchor": "middle", "font-size": 19, "font-weight": 700, fill: "#2f6b52" }));
      svg.appendChild(T(x, y + 44, (+v.toFixed(4)) + "", { "text-anchor": "middle", "font-size": 19, "font-weight": 700, fill: "#4a5b8c" }));
      // 连线
      svg.appendChild(E("line", { x1: x, y1: y - 24, x2: x, y2: y + 26, stroke: "#e5ded2", "stroke-width": 1.5, "stroke-dasharray": "3 3" }));
      vis.appendChild(svg);

      const dec = v >= 1 ? String(+v.toFixed(4)) : String(+v.toFixed(4));
      out.innerHTML =
        "数轴上<strong>同一个点</strong>，两种写法：<b style='color:#2f6b52'>" + M + "/" + D + "</b> 和 <b style='color:#4a5b8c'>" + dec + "</b>。<br>" +
        "它们<strong>指同一个位置</strong>，也就是说 <b>" + M + " ÷ " + D + " = " + dec + "</b>。<br>" +
        "<span style='color:#c4622d'><strong>分数和小数不是两种数，是同一个数的两种写法。</strong><br>" +
        "分数是「分了几份」，小数是「十进制的第几位」——<strong>两条路，同一个目的地</strong>。</span>";
    }
    on("ax-d", "input", go); on("ax-m", "input", go);
    go();
  }

  /* ======================================================================
     ③ 真分数 / 假分数 / 带分数 —— 图形区分
     ====================================================================== */
  function kindDemo() {
    const host = $("kd-demo"); if (!host) return;
    const vis = $("kd-vis"), out = $("kd-out");
    const n = $("kd-n"), d = $("kd-d");
    const nv = $("kd-nv"), dv = $("kd-dv");

    function go() {
      const N = +n.value, D = +d.value;
      nv.textContent = N; dv.textContent = D;
      const whole = Math.floor(N / D), rem = N % D;
      const kind = rem === 0 && N > 0 ? "整除（写成整数）" : N < D ? "真分数" : N === D ? "假分数（刚好 1 个整体）" : "假分数（超过 1 个整体）";
      vis.innerHTML = "";
      const W = 640, H = 170, cy = 70, R = 38, gap = 14;
      const need = Math.ceil(N / D);
      const totalW = need * 2 * R + (need - 1) * gap + 40;
      let cx = Math.max(46, (W - totalW) / 2 + R);
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      for (let w = 0; w < need; w++) {
        svg.appendChild(E("circle", { cx, cy, r: R, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        for (let i = 0; i < D; i++) {
          const a1 = -Math.PI / 2 + (2 * Math.PI * i) / D;
          const a2 = a1 + (2 * Math.PI) / D;
          const filled = w * D + i < N;
          if (filled)
            svg.appendChild(E("path", {
              d: `M${cx},${cy} L${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)} Z`,
              fill: "#2f6b52", opacity: .72,
            }));
        }
        svg.appendChild(T(cx, cy + R + 18, "1", { "text-anchor": "middle", "font-size": 12, fill: "#8d857a" }));
        cx += 2 * R + gap;
      }
      vis.appendChild(svg);

      out.innerHTML =
        N + "/" + D + " 是 <b style='color:#c4622d'>" + kind + "</b>。<br>" +
        (rem === 0 && N > 0
          ? "正好分成整数倍，可以<strong>直接写成 " + whole + "</strong>。"
          : N < D
          ? "分子<strong>比</strong>分母小，图<strong>装不满</strong>一个圆 → <b>真分数</b>，一定小于 1。"
          : "分子<strong>大于等于</strong>分母，图<strong>装满了还多</strong> → <b>假分数</b>，一定大于等于 1。") +
        (N > D && rem > 0
          ? "<br>也可以拆成 <b>" + whole + " 个完整整体，又 " + rem + "/" + D + " —— 写成带分数是 <b>" + whole + " 又 " + rem + "/" + D + "</b>。<br>" +
            "<span style='color:#c4622d'><strong>真分数 &lt; 1，假分数 ≥ 1</strong>——判断真假不用算，看图就知道。</span>"
          : "");
    }
    on("kd-n", "input", go); on("kd-d", "input", go);
    go();
  }

  /* ======================================================================
     ④ 通分 —— 为什么必须先换单位（连接 B2 的"同质规则"）
     ====================================================================== */
  function commonDemo() {
    const host = $("cd-demo"); if (!host) return;
    const vis = $("cd-vis"), out = $("cd-out");
    const b = $("cd-b"), mode = $("cd-mode");

    function go() {
      const D2 = +b.value;
      const comm = D2 * 2;   // 2 和 D2 的公倍数（简化演示）
      vis.innerHTML = "";
      const W = 640, H = 216, cy = 66, R = 44;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });

      // 原始：1/2 和 1/D2
      const drawPie = (cx, D, filled, label, color) => {
        svg.appendChild(E("circle", { cx, cy, r: R, fill: "#f3efe7", stroke: "#cfc7ba", "stroke-width": 2 }));
        for (let i = 0; i < D; i++) {
          const a1 = -Math.PI / 2 + (2 * Math.PI * i) / D;
          const a2 = a1 + (2 * Math.PI) / D;
          if (i < filled)
            svg.appendChild(E("path", {
              d: `M${cx},${cy} L${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)} Z`,
              fill: color, opacity: .72,
            }));
        }
        svg.appendChild(T(cx, cy + R + 20, label, { "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: "#2b2723" }));
      };
      const unified = mode.value === "1";
      if (!unified) {
        drawPie(130, 2, 1, "1/2", "#2f6b52");
        drawPie(330, D2, 1, "1/" + D2, "#4a5b8c");
        svg.appendChild(T(480, cy, "+", { "text-anchor": "middle", "font-size": 26, "font-weight": 700, fill: "#c4622d" }));
        svg.appendChild(T(480, cy + 34, "？", { "text-anchor": "middle", "font-size": 18, fill: "#c4622d", "font-weight": 700 }));
      } else {
        drawPie(180, comm, comm / 2, comm / 2 + "/" + comm, "#2f6b52");
        drawPie(440, comm, comm / D2, comm / D2 + "/" + comm, "#4a5b8c");
        svg.appendChild(T(310, cy, "+", { "text-anchor": "middle", "font-size": 26, "font-weight": 700, fill: "#2f6b52" }));
      }
      vis.appendChild(svg);

      out.innerHTML = unified
        ? "换成 <b>" + comm + " 分之一</b>之后，两个数<strong>单位相同了</strong>：<br>" +
          "<b>" + (comm / 2) + "/" + comm + " + " + (comm / D2) + "/" + comm + " = " + (comm / 2 + comm / D2) + "/" + comm + "</b><br>" +
          "合并同单位的小棒，答案自然出来。<br>" +
          "<span style='color:#c4622d'><strong>通分不是技巧，是换单位</strong>——和整数相加「个位对个位」是<strong>同一条规则</strong>。</span>"
        : "<b>1/2 和 1/" + D2 + " 单位不一样，不能直接加。</b><br>" +
          "一个是「二分之一」，一个是「三分之一」，<em>就像 3 个苹果 + 2 只猫</em>。<br>" +
          "必须<strong>先换成同一个单位</strong>——这就是通分。";
    }
    on("cd-b", "input", go); on("cd-mode", "input", go);
    go();
  }

  /* ======================================================================
     ⑤ 小数点：位置变了，大小差 10 倍
     ====================================================================== */
  function pointDemo() {
    const host = $("pt-demo"); if (!host) return;
    const vis = $("pt-vis"), out = $("pt-out");
    const d = $("pt-d"), mode = $("pt-mode"), dv = $("pt-dv");
    // 位值用**字符串**写死，不做浮点乘法——否则 0.1*0.1 会渲染成 0.010000000000000002
    const INT_NAME = ["个", "十", "百", "千", "万"];
    const INT_VAL = ["1", "10", "100", "1000", "10000"];
    const FRAC_NAME = ["十分位", "百分位", "千分位", "万分位"];
    const FRAC_VAL = ["0.1", "0.01", "0.001", "0.0001"];
    const DIGITS = "123";

    function go() {
      const dp = +d.value;                     // 小数点前有几位
      const showContrib = mode.value === "1";  // 位值标签 ↔ 贡献合计
      if (dv) dv.textContent = dp;

      // 组装版式：从右往左数位，确定每个数字站在哪一位
      const cells = [];                        // {ch, name, val}
      const intCount = dp;
      // 整数部分：最高位是 intCount-1（1 位=个位，2 位=十位…）
      for (let i = 0; i < intCount; i++) {
        const place = intCount - 1 - i;        // 0=个位
        cells.push({ ch: DIGITS[i % 3] || "0", name: INT_NAME[place] || "?", val: INT_VAL[place] || "?" });
      }
      if (intCount === 0) cells.push({ ch: "0", name: INT_NAME[0], val: INT_VAL[0] });
      // 小数点只在有小数位时才画，否则 123 会多出一个尾点
      if (intCount < 3) cells.push({ dot: true });
      // 小数部分：从十分位往右
      for (let i = intCount; i < 3; i++) {
        const place = i - intCount;            // 0=十分位
        cells.push({ ch: DIGITS[i % 3] || "0", name: FRAC_NAME[place] || "?", val: FRAC_VAL[place] || "?" });
      }

      vis.innerHTML = "";
      const W = 640, cw = 54, y0 = 58;
      const H = 190;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      const x0 = Math.max(24, (W - cells.length * cw) / 2);

      // 顶部：每位代表的数量（位值）
      cells.forEach((c, n) => {
        const x = x0 + n * cw;
        if (c.dot) {
          svg.appendChild(T(x + cw / 2, y0 + 30, ".", { "text-anchor": "middle", "font-size": 30, "font-weight": 700, fill: "#c4622d" }));
          svg.appendChild(E("line", { x1: x + cw / 2, y1: y0 - 14, x2: x + cw / 2, y2: y0 + 44, stroke: "#c4622d", "stroke-width": 2 }));
          svg.appendChild(T(x + cw / 2, y0 - 20, "小数点", { "text-anchor": "middle", "font-size": 11, fill: "#c4622d" }));
          return;
        }
        svg.appendChild(T(x + cw / 2, y0 - 20, showContrib ? (c.ch + " × " + c.val) : c.val,
          { "text-anchor": "middle", "font-size": 11, fill: "#2f6b52" }));
      });

      // 中间：数字格
      cells.forEach((c, n) => {
        const x = x0 + n * cw;
        if (c.dot) return;
        svg.appendChild(E("rect", { x, y: y0, width: cw - 4, height: 42, rx: 5, fill: "#f3efe7", stroke: "#cfc7ba" }));
        svg.appendChild(T(x + (cw - 4) / 2, y0 + 30, c.ch,
          { "text-anchor": "middle", "font-size": 24, "font-weight": 700, "font-family": "ui-monospace, monospace" }));
        svg.appendChild(T(x + (cw - 4) / 2, y0 + 64, c.name, { "text-anchor": "middle", "font-size": 12, fill: "#5c554d" }));
      });
      vis.appendChild(svg);

      // 数值：用字符串拼接，不做浮点累加
      const numText = cells.map((c) => (c.dot ? "." : c.ch)).join("");
      const contrib = cells.filter((c) => !c.dot)
        .map((c) => c.ch + " × " + c.val).join(" + ");
      out.innerHTML =
        "<b>" + numText + "</b> —— 同样的三个数字 1、2、3，只因小数点位置不同，值就变了。<br>" +
        (showContrib
          ? "每一位的贡献：<strong>" + contrib + "</strong>。<br>"
          : "盯住每位数字<strong>下面的位值标签</strong>：整数部分是「几个十、几个一」，"
            + "小数部分是「几个十分之一、几个百分之一」。<br>") +
        "<span style='color:#c4622d'><strong>小数点移动一位，值就差 10 倍</strong>——"
        + "向右移变大，向左移变小。<br>"
        + "这和<a href='../pillar/number.html'>支柱一</a>的位值制<strong>完全是同一条规则</strong>，"
        + "只是继续往右细分。</span>";
    }
    on("pt-d", "input", go); on("pt-mode", "input", go);
    go();
  }

  /* ======================================================================
     ⑥ 因数与倍数 —— 一个数的因数，就是能把它平分成几份
     ====================================================================== */
  function factorDemo() {
    const host = $("ft-demo"); if (!host) return;
    const vis = $("ft-vis"), out = $("ft-out");
    const n = $("ft-n");
    const nv = $("ft-nv");

    function go() {
      const N = +n.value;
      nv.textContent = N;
      const factors = [];
      for (let i = 1; i <= N; i++) if (N % i === 0) factors.push(i);
      const pairs = [];
      // 只保留两个因数都 >1 的配对，(1, N) 是平凡配对，不算"拆开"
      for (const f of factors) if (f > 1 && N / f > 1 && N / f >= f) pairs.push([f, N / f]);
      const isPrime = factors.length === 2;
      const isComp = factors.length > 2;

      vis.innerHTML = "";
      const W = 640, H = 176;
      const svg = E("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      // 因数积
      const y = 44;
      svg.appendChild(T(20, y + 22, N + " 的所有因数：", { "font-size": 14, "font-weight": 700, fill: "#2b2723" }));
      factors.forEach((f, i) => {
        const x = 150 + i * 52;
        svg.appendChild(E("rect", { x, y, width: 44, height: 34, rx: 6, fill: isPrime ? "#f3efe7" : "#e8f1ec", stroke: "#6aa287", "stroke-width": 1.5 }));
        svg.appendChild(T(x + 22, y + 24, f, { "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: "#2f6b52", "font-family": "ui-monospace, monospace" }));
        if (i) svg.appendChild(T(x - 8, y + 24, "×", { "font-size": 15, fill: "#8d857a" }));
      });
      // 因数配对
      svg.appendChild(T(20, 120, "因数配对：", { "font-size": 14, "font-weight": 700, fill: "#2b2723" }));
      pairs.forEach((p, i) => {
        const x = 150 + i * 96;
        svg.appendChild(T(x, 124, p[0] + " × " + p[1], { "font-size": 16, "font-weight": 600, fill: "#c4622d", "font-family": "ui-monospace, monospace" }));
      });
      svg.appendChild(T(150 + pairs.length * 96, 124, "= " + N, { "font-size": 16, "font-weight": 700, fill: "#2f6b52" }));
      // 2/3/5倍数
      const special = [];
      if (N % 2 === 0) special.push("2 的倍数");
      if (N % 3 === 0) special.push("3 的倍数");
      if (N % 5 === 0) special.push("5 的倍数");
      svg.appendChild(T(20, 160, special.length ? "它是：" + special.join("、") : "它不是 2、3、5 的倍数", { "font-size": 13.5, fill: "#5c554d" }));
      vis.appendChild(svg);

      out.innerHTML =
        "<b>" + N + " 的因数有 " + factors.length + " 个：" + factors.join("、") + "</b><br>" +
        (isPrime
          ? "只有 1 和它自己 <b>2 个因数</b> → <b style='color:#2f6b52'>质数</b>（质数只能写成 1 × 自己）"
          : isComp
          ? "有 " + factors.length + " 个因数 → <b style='color:#c4622d'>合数</b>（能拆成两个大于 1 的数相乘" +
            (pairs.length ? "，如 " + pairs[0][0] + " × " + pairs[0][1] : "") + "）"
          : "只有 1 个因数 → 1 <b>既不是质数也不是合数</b>") +
        "<br><span style='color:#8d857a'>「因数」的另一面是「倍数」：<b>" + N + " 是 " + factors.join("、") + " 的倍数</b>。两者说的是同一件事的两个方向。</span>";
    }
    on("ft-n", "input", go);
    go();
  }

  function boot() { bornDemo(); axisDemo(); kindDemo(); commonDemo(); pointDemo(); factorDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
