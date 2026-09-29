/* ==========================================================================
   guangle.js —— 数学广角专用交互图示
   ---------------------------------------------------------------------------
   广角题的核心不是「算」，是「想明白怎么想」。所以每个图示都强制孩子
   亲手做一次，而不是看一遍答案。
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, fn); };
  const set = (id, html) => { const e = $(id); if (e) e.innerHTML = html; };

  /* ======================================================================
     ① 搭配 —— 乘法原理：有序搭配 = 分步相乘
     问：3 件上衣 + 2 条裤子，一共几套？
     ====================================================================== */
  function paipeiDemo() {
    const host = $("pp-demo"); if (!host) return;
    const T = ["红", "黄", "蓝"], P = ["长裤", "短裤"];
    const grid = $("pp-grid"), out = $("pp-out");
    let selT = 0, selP = 0;
    let pairs = new Set();

    function paint() {
      grid.innerHTML = "";
      const tbl = document.createElement("div");
      tbl.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:420px";
      T.forEach((t, i) => {
        const b = document.createElement("button");
        b.className = "btn" + (selT === i ? " btn-primary" : "");
        b.textContent = t;
        b.onclick = () => { selT = i; paint(); };
        tbl.appendChild(b);
      });
      grid.appendChild(tbl);

      const tbl2 = document.createElement("div");
      tbl2.style.cssText = "display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:280px;margin-top:10px";
      P.forEach((p, i) => {
        const b = document.createElement("button");
        b.className = "btn" + (selP === i ? " btn-primary" : "");
        b.textContent = p;
        b.onclick = () => { selP = i; paint(); };
        tbl2.appendChild(b);
      });
      grid.appendChild(tbl2);

      const bt = document.createElement("button");
      bt.className = "btn btn-primary"; bt.style.marginTop = "14px";
      bt.textContent = pairs.has(selT + "-" + selP) ? "取消这套" : "配上这套";
      bt.onclick = () => {
        const k = selT + "-" + selP;
        if (pairs.has(k)) pairs.delete(k); else pairs.add(k);
        paint();
      };
      grid.appendChild(bt);

      const total = T.length * P.length;
      out.innerHTML =
        "你已配出 <b>" + pairs.size + "</b> 套。一共能配 <b>" + total + "</b> 套。<br>" +
        (pairs.size === total
          ? "全配出来了。注意：<b>上衣有 3 种，每种都能配 2 条裤子 = 3×2 = 6 套</b>。" +
            "你根本不需要配 6 次——<b>看出一层就有几套，另一层随便选一个，乘起来就是答案</b>。"
          : "继续配到全部配完。然后回头看：你其实<strong>不需要真的配</strong>。" +
            "3 件上衣，每件都刚好能配 2 条裤子 → 3 × 2 = 6。这就是<strong>乘法原理</strong>。");
    }
    paint();
  }

  /* ======================================================================
     ② 推理 —— 排除法：从最确定的条件切进去
     ====================================================================== */
  function tuiliDemo() {
    const host = $("tl-demo"); if (!host) return;
    const out = $("tl-out"), vis = $("tl-vis");
    const NAMES = ["小明", "小红", "小华", "小强"], COL = ["红", "黄", "蓝", "绿"];

    const CLUES = [
      { txt: "小明的球<strong>不是</strong>红色，也不是黄色。", ok: (a) => a[0] !== 0 && a[0] !== 1 },
      { txt: "小红的球是黄色。", ok: (a) => a[1] === 1 },
      { txt: "小华的球<strong>不是</strong>绿色。", ok: (a) => a[2] !== 3 },
      { txt: "小强拿的是<strong>剩下的那一个</strong>。", ok: () => true, trivial: true },
    ];
    let picked = [];   // 孩子勾选的线索下标
    let solved = false;

    // 枚举全部 4!=24 种分配，保留满足「已勾线索」的解。
    // 某个人在所有存活解里颜色一致 → 这个人被确定了。
    //
    // 排列生成必须用标准算法：早先用 `p % 4` 取四进制位，
    // 0~23 的四进制里会出现 4/5 这类非法下标，补位后又产生重复，
    // 24 条里只有 15 个不同排列、漏掉 9 个真实排列，所有计数都是错的。
    const ALL_PERMS = (() => {
      const out = [];
      (function perm(arr, cur) {
        if (!arr.length) { out.push(cur.slice()); return; }
        for (let i = 0; i < arr.length; i++) {
          perm(arr.slice(0, i).concat(arr.slice(i + 1)), cur.concat(arr[i]));
        }
      })([0, 1, 2, 3], []);
      return out;
    })();

    function analyze(idxs) {
      const alive = ALL_PERMS.filter((a) => idxs.every((k) => CLUES[k].ok(a)));
      const fixed = NAMES.map((_, i) => {
        const set = new Set(alive.map((a) => a[i]));
        return set.size === 1 ? [...set][0] : null;
      });
      return { alive, fixed };
    }

    function build() {
      vis.innerHTML = "";
      const box = document.createElement("div");
      box.style.cssText = "max-width:560px";

      const title = document.createElement("div");
      title.style.cssText = "font-size:13px;color:var(--ink-faint);margin-bottom:8px";
      title.innerHTML = "① 勾出你<strong>用上了</strong>的线索：";
      box.appendChild(title);

      const list = document.createElement("div");
      list.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-bottom:12px";
      CLUES.forEach((cl, i) => {
        const row = document.createElement("div");
        const on2 = picked.includes(i);
        row.style.cssText = "display:flex;gap:9px;align-items:flex-start;padding:8px 11px;border-radius:9px;cursor:pointer;font-size:14px;line-height:1.6;" +
          "border:1.5px solid " + (on2 ? "#2f6b52" : "#e5ded2") + ";background:" + (on2 ? "#e8f1ec" : "#fff");
        row.innerHTML = "<span style='font-weight:700;color:" + (on2 ? "#2f6b52" : "#c9c1b4") + "'>" + (on2 ? "☑" : "☐") + "</span><span>" + cl.txt + "</span>";
        row.addEventListener("click", () => {
          const k = picked.indexOf(i);
          if (k >= 0) picked.splice(k, 1); else picked.push(i);
          solved = false;
          build();
        });
        list.appendChild(row);
      });
      box.appendChild(list);

      const btn = document.createElement("button");
      btn.className = "btn btn-primary";
      btn.textContent = solved ? "再算一次" : "看结论";
      btn.addEventListener("click", () => { solved = true; build(); });
      box.appendChild(btn);
      vis.appendChild(box);
      // 关键：重建面板后必须重算结论文字。原先只调 build() 不调 show()，
      // 勾选框会变 ☑/☐ 但「已勾 N 条」永远停在 0。
      show();
    }

    function show() {
      const { alive, fixed } = analyze(picked);
      const n = fixed.filter((v) => v !== null).length;
      const cards = document.createElement("div");
      cards.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:460px;margin-top:14px";
      NAMES.forEach((nm, i) => {
        const d = document.createElement("div");
        const got = fixed[i] !== null;
        d.style.cssText = "padding:12px 6px;border-radius:9px;text-align:center;font-size:14px;" +
          "border:1.5px solid " + (got ? "#2f6b52" : "#e5ded2") + ";background:" + (got ? "#e8f1ec" : "#fff");
        d.innerHTML = "<div style='font-size:15px;font-weight:600'>" + nm + "</div>" +
          "<div style='color:" + (got ? "#2f6b52" : "#c9c1b4") + ";font-weight:700;margin-top:4px'>" +
          (got ? COL[fixed[i]] + "球" : "还定不了") + "</div>";
        cards.appendChild(d);
      });
      vis.appendChild(cards);

      if (!solved) {
        out.innerHTML = "<b>已勾 " + picked.length + " 条线索</b>，还剩 <b>" + alive.length + "</b> 种可能没被排除。<br>" +
          "能确定 <b>" + n + "/4</b> 个人。" +
          (picked.length === 0 ? "<br><span style='color:#8d857a'>先勾一条试试——<strong>优先勾「直接说死」的那条</strong>，比如「小红的球是黄色」。</span>" : "") +
          (alive.length === 0 ? "<br><span style='color:#c4622d'>没有解，说明线索之间矛盾了。</span>" : "");
        return;
      }

      const useless = CLUES[3].trivial;
      out.innerHTML =
        "<b>勾了 " + picked.length + " 条线索 → 剩 " + alive.length + " 种可能，确定 " + n + " 个人。</b><br>" +
        (picked.length === 0
          ? "一条没勾时，4 个人谁拿什么颜色都不确定——<strong>这就是「多知道一点 = 少一种可能」的反面：不知道，就全都可能</strong>。"
          : "") +
        (picked.indexOf(1) >= 0 && picked.indexOf(0) < 0
          ? "<span style='color:#c4622d'>注意：你勾了「小红的球是黄色」这条<strong>确定的</strong>线索，效果比勾前两条都大。" +
            "<strong>从最确定的那句入手</strong>，这是本页最重要的一句。</span><br>"
          : "") +
        "<span style='color:#c4622d'><strong>为什么小强那条线索没用？</strong>" +
        "「剩下的那一个」是<strong>废话</strong>——球只有 4 个颜色 4 个人，本来就必然剩下一个。" +
        "它<strong>不排除任何可能</strong>，所以一条也没砍掉。<br>" +
        "这就是本题真正要教的事：<strong>不是线索越多越好，是「能砍掉可能」的线索才有用。</strong></span>";
      void useless;
    }

    build();
  }
  function jiheDemo() {
    const host = $("jh-demo"); if (!host) return;
    const out = $("jh-out"), vis = $("jh-vis");
    const aIn = $("jh-a"), bIn = $("jh-b"), bothIn = $("jh-both");
    let A = 5, B = 4, both = 2;

    function go() {
      A = +aIn.value; B = +bIn.value;
      // 重叠数必须读滑块：原先写死 both=2，拖动「重叠」滑块毫无反应
      both = Math.max(0, Math.min(+bothIn.value, A, B));
      bothIn.value = both;
      bothIn.max = Math.min(A, B);
      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 640 260", width: "100%" });
      const onlyA = A - both, onlyB = B - both;
      // 两个圆
      svg.appendChild(el("circle", { cx: 235, cy: 130, r: 100, fill: "#2f6b52", opacity: .18, stroke: "#2f6b52", "stroke-width": 2 }));
      svg.appendChild(el("circle", { cx: 405, cy: 130, r: 100, fill: "#c4622d", opacity: .18, stroke: "#c4622d", "stroke-width": 2 }));
      const put = (x, y, t, c) => {
        const e = el("text", { x, y, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: c });
        e.textContent = t; svg.appendChild(e);
      };
      put(160, 100, "只参加篮球", "#2f6b52");
      put(160, 124, onlyA + " 人", "#2f6b52");
      put(320, 100, "两项都参加", "#5c554d");
      put(320, 124, both + " 人", "#c4622d");
      put(480, 100, "只参加足球", "#c4622d");
      put(480, 124, onlyB + " 人", "#c4622d");
      const l1 = el("text", { x: 130, y: 250, "font-size": 14, fill: "#5c554d" });
      l1.textContent = "篮球社 " + A + " 人"; svg.appendChild(l1);
      const l2 = el("text", { x: 510, y: 250, "font-size": 14, fill: "#5c554d" });
      l2.textContent = "足球社 " + B + " 人"; svg.appendChild(l2);
      vis.appendChild(svg);

      out.innerHTML =
        "直接相加是 <b>" + A + " + " + B + " = " + (A + B) + "</b> 人。<br>" +
        "但中间那 <b>" + both + "</b> 个两项都参加的人，<b>被数了两次</b>。<br>" +
        "正确：<b>" + A + " + " + B + " − " + both + " = " + (A + B - both) + "</b> 人。<br>" +
        "<span style='color:#c4622d'><strong>重叠的部分，只能算一次</strong> —— 这是这一类题的全部难点。</span>";
    }
    on("jh-a", "input", go);
    on("jh-b", "input", go);
    on("jh-both", "input", go);
    go();
  }

  /* ======================================================================
     ④ 优化（统筹）—— 顺序不同，总时间不同
     ====================================================================== */
  function youhuaDemo() {
    const host = $("yh-demo"); if (!host) return;
    const out = $("yh-out"), vis = $("yh-vis");
    const r = $("yh-r"), rv = $("yh-rv");
    let mode = 0; // 0=错误 1=正确

    function go() {
      const y = +r.value;              // 妈妈洗锅 1 分钟
      const totalBad = y + 3 + 4;      // 洗锅+烧水3+沏茶4 串行
      const totalGood = Math.max(y, 3) + 1 + 4;  // 洗锅时烧水，沏茶要1分钟
      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 640 250", width: "100%" });
      const label = { "洗锅": "#2f6b52", "烧水": "#c4622d", "沏茶": "#4a5b8c" };
      const bar = (y0, tasks, title) => {
        const t = el("text", { x: 6, y: y0 - 8, "font-size": 13, "font-weight": 700, fill: "#5c554d" });
        t.textContent = title; svg.appendChild(t);
        let x = 0;
        tasks.forEach(([name, d]) => {
          svg.appendChild(el("rect", { x: x, y: y0, width: d * 40, height: 26, fill: label[name], opacity: .85, rx: 4 }));
          const tt = el("text", { x: x + d * 20, y: y0 + 18, "text-anchor": "middle", "font-size": 12, fill: "#fff", "font-weight": 700 });
          tt.textContent = name; svg.appendChild(tt);
          x += d * 40;
        });
        const tot = el("text", { x: x + 8, y: y0 + 18, "font-size": 13, fill: "#2b2723", "font-weight": 700 });
        tot.textContent = "共 " + (x / 40) + " 分钟";
        svg.appendChild(tot);
      };
      bar(30, [["洗锅", y], ["烧水", 3], ["沏茶", 4]], "❌ 一件做完再做下一件");
      bar(110, [["洗锅", y], ["烧水", 3], ["沏茶", 4]], "❌ 还是串行（对照）");
      // 正确方案：洗锅与烧水部分重叠
      const t2 = el("text", { x: 6, y: 190 - 8, "font-size": 13, "font-weight": 700, fill: "#2f6b52" });
      t2.textContent = "✅ 洗锅的同时烧水"; svg.appendChild(t2);
      svg.appendChild(el("rect", { x: 0, y: 190, width: y * 40, height: 26, fill: label["洗锅"], opacity: .85, rx: 4 }));
      svg.appendChild(el("rect", { x: 0, y: 190, width: 3 * 40, height: 26, fill: label["烧水"], opacity: .55, rx: 4 }));
      svg.appendChild(el("rect", { x: Math.max(y, 3) * 40, y: 190, width: 1 * 40, height: 26, fill: label["沏茶"], opacity: .85, rx: 4 }));
      svg.appendChild(el("text", { x: Math.max(y, 3) * 40 + 50, y: 208, "font-size": 13, fill: "#2f6b52", "font-weight": 700 }));
      out.innerHTML =
        "串行做：<b>" + totalBad + " 分钟</b>　　｜　统筹后：<b>" + totalGood + " 分钟</b><br>" +
        "省下 <b>" + (totalBad - totalGood) + " 分钟</b>，因为<b>洗锅的时候，水可以同时烧</b>。<br>" +
        "<strong>能同时做的事，就不要排队做。</strong>这就是「优化」——不是算得更快，是<strong>安排得更聪明</strong>。";
    }
    on("yh-r", "input", () => { rv.textContent = r.value; go(); });
    go();
  }

  /* ======================================================================
     ⑤ 鸡兔同笼 —— 假设法：先假设全是鸡
     ====================================================================== */
  function jituDemo() {
    const host = $("jt-demo"); if (!host) return;
    const out = $("jt-out"), vis = $("jt-vis");
    const headIn = $("jt-head"), footIn = $("jt-foot");
    const guessIn = $("jt-guess");
    let guess = 5;

    function solve() {
      const H = +headIn.value, F = +footIn.value;
      if (guess > H) { guess = H; guessIn.value = H; }
      // 全是鸡时的脚
      const allChicken = H * 2, allRabbit = H * 4;
      // 无解守卫：腿数必须落在 2×头数 与 4×头数 之间，否则会算出「兔=30只」这种荒谬结果
      if (F < allChicken || F > allRabbit) {
        return { H, F, allChicken, allRabbit, unsolvable: true };
      }
      const diff = F - allChicken;
      const rabbit = Math.round(diff / 2);
      const chicken = H - rabbit;
      return { H, F, allChicken, diff, rabbit, chicken, unsolvable: false };
    }

    function go() {
      guess = +guessIn.value;
      const s = solve();
      vis.innerHTML = "";

      // 无解组合：先拦下来，别让「兔 = 30 只」这种结果出现
      if (s.unsolvable) {
        const svg = el("svg", { viewBox: "0 0 640 200", width: "100%" });
        const t1 = el("text", { x: 320, y: 86, "text-anchor": "middle", "font-size": 17, "font-weight": 700, fill: "#c4622d" });
        t1.textContent = "这组数搭不出来 —— 没有解";
        const t2 = el("text", { x: 320, y: 116, "text-anchor": "middle", "font-size": 14, fill: "#5c554d" });
        t2.textContent = s.H + " 个头却有 " + s.F + " 条腿，这组数据搭不出来。";
        const t3 = el("text", { x: 320, y: 140, "text-anchor": "middle", "font-size": 14, fill: "#5c554d" });
        t3.textContent = s.H + " 个头，腿数只能在 " + s.allChicken + " 条（全是鸡）到 " + s.allRabbit + " 条（全是兔）之间。";
        const t4 = el("text", { x: 320, y: 164, "text-anchor": "middle", "font-size": 13.5, fill: "#8d857a" });
        t4.textContent = "你的 " + s.F + " 条腿已经超出范围，把滑块拉回这个区间试试。";
        [t1, t2, t3, t4].forEach((t) => svg.appendChild(t));
        vis.appendChild(svg);
        out.innerHTML =
          "<b>这组数据无解。</b><br>" +
          "<strong>" + s.H + " 个头</strong>时，腿数最少 " + s.allChicken + " 条（全是鸡），最多 " + s.allRabbit + " 条（全是兔）。<br>" +
          "<strong>" + s.F + " 条腿</strong>" + (s.F < s.allChicken ? "少于 " + s.allChicken + " 条，连全是鸡都不够。" : "多于 " + s.allRabbit + " 条，连全是兔都不够。") +
          "<br><span style='color:#c4622d'><strong>假设法第一步就该检查这一步</strong>——不然会算出「兔 = " +
          Math.round((s.F - s.allChicken) / 2) + " 只」这种超过头数的荒谬结果。</span>";
        return;
      }

      const svg = el("svg", { viewBox: "0 0 640 200", width: "100%" });
      // 头
      for (let i = 0; i < s.H; i++) {
        const x = 20 + (i % 10) * 60, y = 40 + Math.floor(i / 10) * 40;
        const isR = i >= s.chicken;
        svg.appendChild(el("circle", {
          cx: x, cy: y, r: 15,
          fill: isR ? "#c4622d" : "#6aa287", opacity: isR ? .9 : .5,
          stroke: "#fff", "stroke-width": 2,
        }));
      }
      // 脚（腿）
      for (let i = 0; i < s.H; i++) {
        const x = 20 + (i % 10) * 60, y = 40 + Math.floor(i / 10) * 40;
        const isR = i >= s.chicken;
        [1, 2].forEach(k => {
          const l = el("line", { x1: x, y1: y + 15, x2: x + (k - 1) * 5, y2: y + 22, stroke: isR ? "#c4622d" : "#6aa287", "stroke-width": 2, opacity: isR ? 1 : .5 });
          svg.appendChild(l);
        });
      }
      const l1 = el("text", { x: 20, y: 22, "font-size": 13, fill: "#5c554d" });
      l1.textContent = "🟢 绿=鸡（2 条腿）　🔴 红=兔（4 条腿）　你的猜测：" + guess + " 只兔";
      svg.appendChild(l1);
      vis.appendChild(svg);

      const realFeet = s.chicken * 2 + s.rabbit * 4;
      const guessFeet = (s.H - guess) * 2 + guess * 4;
      out.innerHTML =
        "你的猜测：<b>" + guess + " 只兔、" + (s.H - guess) + " 只鸡</b> → 腿共 <b>" + guessFeet + "</b> 条。<br>" +
        "实际是 <b>" + s.F + "</b> 条，" + (guessFeet === s.F ? "你猜对了！" : "差了 <b>" + Math.abs(s.F - guessFeet) + "</b> 条。") +
        "<br><br><b>假设法</b>：假设全是鸡 → <b>" + s.H + "×2 = " + s.allChicken + "</b> 条腿，" +
        "比实际<strong>少</strong> <b>" + s.diff + "</b> 条。每把 1 只鸡换成 1 只兔，<strong>多 2 条腿</strong>。" +
        (s.diff >= 0 ? "<br>所以兔 = " + s.diff + " ÷ 2 = <b>" + s.rabbit + "</b> 只，鸡 = <b>" + s.chicken + "</b> 只。" : "") +
        "<br><span style='color:#c4622d'><strong>反过来</strong>——如果头比脚还多（比如全是兔），就假设全是兔，让腿「变少」。</span>";
    }
    [headIn, footIn, guessIn].forEach(e => e && e.addEventListener("input", go));
    go();
  }

  /* ======================================================================
     ⑥ 植树问题 —— 间隔数 和 棵数 到底是什么关系
     ====================================================================== */
  function zhishuDemo() {
    const host = $("zs-demo"); if (!host) return;
    const out = $("zs-out"), vis = $("zs-vis");
    const lenIn = $("zs-len"), gapIn = $("zs-gap");
    const r = $("zs-mode"), rv = $("zs-modev");

    function go() {
      const L = +lenIn.value, g = +gapIn.value;
      const gaps = Math.floor(L / g);
      const modes = { "0": gaps + 1, "1": gaps, "2": gaps > 0 ? gaps - 1 : 0, "3": gaps };
      const m = r.value, n = modes[m];
      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 640 160", width: "100%" });
      const x0 = 30, x1 = 610, total = x1 - x0, step = gaps > 0 ? total / gaps : total;
      // 间隔
      for (let i = 0; i < gaps; i++) {
        const x = x0 + i * step;
        svg.appendChild(el("line", { x1: x, y1: 92, x2: x + step, y2: 92, stroke: "#cfc7ba", "stroke-width": 3 }));
        if (gaps <= 8) {
          const t = el("text", { x: x + step / 2, y: 84, "text-anchor": "middle", "font-size": 11, fill: "#8d857a" });
          t.textContent = g; svg.appendChild(t);
        }
      }
      // 端点线
      svg.appendChild(el("line", { x1: x0, y1: 70, x2: x1, y2: 70, stroke: "#2b2723", "stroke-width": 2.5 }));
      // 树
      for (let i = 0; i < n; i++) {
        let x;
        if (m === "0") x = x0 + i * step;
        else if (m === "1") x = x0 + step / 2 + i * step;
        else if (m === "2") x = x0 + i * step;
        else x = x0 + (i * 2 + 1) * (step / 2);
        svg.appendChild(el("path", {
          d: `M${x} 60 l-11 22 h22 z`, fill: "#2f6b52",
        }));
        svg.appendChild(el("rect", { x: x - 1.5, y: 60, width: 3, height: 10, fill: "#8d857a" }));
      }
      // 间隔标注
      const gl = el("text", { x: (x0 + x1) / 2, y: 120, "text-anchor": "middle", "font-size": 13, fill: "#5c554d" });
      gl.textContent = "全长 " + L + " 米，每隔 " + g + " 米一个坑 → 共 " + gaps + " 个间隔";
      svg.appendChild(gl);
      vis.appendChild(svg);

      const names = { "0": "两端都种", "1": "只种一端", "2": "两端都不种", "3": "两端都种且是封闭的（圆）" };
      out.innerHTML =
        "<b>" + names[m] + "</b>：<b>" + n + "</b> 棵。<br>" +
        (m === "0" ? "关键：<b>棵数 = 间隔数 + 1</b>。因为每一个坑旁边都有树，但<strong>两个端点的坑也各有一棵</strong>——数间隔时会漏掉最后那棵。"
          : m === "1" ? "<b>棵数 = 间隔数</b>。种一端，就是每个坑上站一棵树。"
          : m === "2" ? "<b>棵数 = 间隔数 − 1</b>。两端都不种，端点那两个坑是空的。"
          : "<b>棵数 = 间隔数</b>。围成一圈时<strong>没有首尾之分</strong>——最后一个间隔的终点就是第一个坑，转一圈正好一坑一树。") +
        "<br><span style='color:#c4622d'><strong>先问「两端种不种」，再决定用哪个式子」——90% 的错都出在没问这一句。</span>";
    }
    [lenIn, gapIn, r].forEach(e => e && e.addEventListener("input", () => { rv.textContent = r.value ? r.options[r.selectedIndex].text : ""; go(); }));
    rv.textContent = r.options[r.selectedIndex].text;
    go();
  }

  /* ======================================================================
     ⑦ 找次品 —— 二分法：每称一次，能砍掉 2/3 的可能
     ====================================================================== */
  function zhaocipinDemo() {
    const host = $("zc-demo"); if (!host) return;
    const out = $("zc-out"), vis = $("zc-vis");
    const nIn = $("zc-n");
    const choose = $("zc-choose");
    const MATH = { 3: 1, 8: 2, 9: 2, 10: 3, 12: 3, 13: 3, 27: 3 };

    // cands 才是真相：坏品必在其中，每次称完按天平结果收缩。
    // 原实现虽然也用 left 收窄，但文字始终按「最初 n 个」叙述，
    // 出现「画面已剩 3 个、说明还在说分 9 个」的脱节。
    let cands = [], bad = -1, groups = [], used = 0, log = [];

    function reset() {
      const n = +nIn.value;
      bad = Math.floor(n / 2);                 // 取中间，最难的情况
      cands = Array.from({ length: n }, (_, i) => i);
      groups = []; used = 0; log = [];
      if (choose) choose.style.display = "none";
      draw();
    }

    function split(list) {
      const m = Math.max(1, Math.ceil(list.length / 3));
      return [list.slice(0, m), list.slice(m, 2 * m), list.slice(2 * m)];
    }

    function draw(note) {
      const n = +nIn.value;
      if (!groups.length) groups = split(cands);
      const [a, b, c] = groups;
      if (choose) choose.style.display = cands.length > 1 ? "" : "none";

      vis.innerHTML = "";
      const svg = el("svg", { viewBox: "0 0 640 200", width: "100%" });
      const names = ["① 左盘", "② 右盘", "③ 放在旁边"];
      [a, b, c].forEach((g, i) => {
        if (!g.length) return;
        const X = 40 + i * 200;
        svg.appendChild(el("path", {
          d: `M${X - 62} 96 h124 a62 26 0 0 1 -124 0 z`,
          fill: i === 2 ? "#f3efe7" : "#e8f1ec", stroke: "#8d857a", "stroke-width": 2,
        }));
        const t = el("text", { x: X, y: 94, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#5c554d" });
        t.textContent = names[i] + "（" + g.length + " 个）";
        svg.appendChild(t);
        const perRow = 9;
        g.forEach((id, j) => {
          const row = Math.floor(j / perRow), col = j % perRow;
          const rowN = Math.min(perRow, g.length - row * perRow);
          const cx = X - ((rowN - 1) * 21) / 2 + col * 21;
          const cy = 72 - row * 21;
          const isBad = id === bad;
          svg.appendChild(el("circle", {
            cx, cy, r: 9, fill: isBad ? "#c4622d" : "#6aa287", opacity: isBad ? .35 : .9,
            stroke: isBad ? "#c4622d" : "#4f7d68", "stroke-width": isBad ? 2.5 : 1,
          }));
        });
      });
      // 天平
      svg.appendChild(el("line", { x1: 320, y1: 136, x2: 320, y2: 176, stroke: "#8d857a", "stroke-width": 5 }));
      svg.appendChild(el("line", { x1: 268, y1: 136, x2: 372, y2: 136, stroke: "#8d857a", "stroke-width": 5 }));
      const t2 = el("text", { x: 320, y: 30, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#2f6b52" });
      t2.textContent = "第 " + used + " 称　候选 " + cands.length + " 个（最初 " + n + " 个）";
      svg.appendChild(t2);
      vis.appendChild(svg);

      const worst = Math.max(1, Math.ceil(Math.log(n) / Math.log(3)));
      const per = Math.max(1, Math.ceil(cands.length / 3));
      out.innerHTML =
        (note ? "<b>" + note + "</b><br>" : "") +
        "把候选的 <b>" + cands.length + "</b> 个，每 <b>" + per + "</b> 个一组，分成三份上秤。<br>" +
        "因为坏的<strong>只有 1 个</strong>，左盘和右盘<strong>最多只有一边会翘</strong>。" +
        "翘的那一边里就有坏球；<strong>如果都平，坏的在第三份里</strong>。<br>" +
        "所以每次称完，<b>" + cands.length + " 个的可能缩小到 " + Math.min(cands.length, per) + " 个</b>——" +
        "<strong>范围是在缩小的，这正是三分法比两分法快的原因</strong>。<br>" +
        (cands.length === 1
          ? "✅ 找到了：<b>第 " + cands.length + " 号球</b>是次品，一共称了 <b>" + used + "</b> 次" +
            "。" + (used <= worst
              ? "<strong>这已经是最优解了</strong>——" + n + " 个最坏情况只需 " + worst + " 次。"
              : "还能再省：最优只要 " + worst + " 次，下次注意三份要尽量均分。")
          : (used > 0 ? "现在<strong>点下面的按钮</strong>，告诉我天平翘的是哪一边。<br>" : "") +
            "继续称，最坏情况要称 <b>" + worst + "</b> 次（" + n + " 个 → 3²=" + (3 * 3) + "，" + n + " 个在 3² 与 3³ 之间）。") +
        (log.length ? "<br><span style='color:#8d857a;font-size:13px'>过程：" + log.join(" → ") + "</span>" : "");
    }

    function answer(which) {
      const [a, b, c] = groups;
      if (!a.length) return;
      const was = cands.length;
      if (which === 2) { cands = c; log.push("第" + used + "称平→" + cands.length); }
      else { cands = (which === 0 ? a : b); log.push("第" + used + "称" + (which === 0 ? "左" : "右") + "翘→" + cands.length); }
      used++;
      groups = [];
      draw("候选从 " + was + " 个缩到 " + cands.length + " 个。");
    }

    const on = (id, fn) => { const e = $(id); if (e) e.addEventListener("click", fn); };
    on("zc-left", () => answer(0));
    on("zc-right", () => answer(1));
    on("zc-same", () => answer(2));
    on("zc-reset", reset);
    if (nIn) nIn.addEventListener("input", reset);
    reset();
  }
  function shuxingDemo() {
    const host = $("sx-demo"); if (!host) return;
    const out = $("sx-out"), vis = $("sx-vis");
    const r = $("sx-r"), rv = $("sx-rv");

    function go() {
      const n = +r.value;
      vis.innerHTML = "";
      const cell = 30, W = 640, pad = 24;
      const svg = el("svg", { viewBox: "0 0 " + W + " 240", width: "100%" });
      const ox = pad, oy = 30;

      // 点阵
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= n; j++)
          svg.appendChild(el("circle", { cx: ox + i * cell, cy: oy + j * cell, r: 3, fill: "#cfc7ba" }));

      // 连出所有以左上角为顶点的直角三角形
      let cnt = 0;
      for (let i = 1; i <= n; i++)
        for (let j = 1; j <= n; j++) {
          svg.appendChild(el("path", {
            d: `M${ox} ${oy} L${ox + i * cell} ${oy} L${ox} ${oy + j * cell} Z`,
            fill: ["#2f6b52", "#c4622d", "#4a5b8c"][(i + j) % 3], opacity: .22,
            stroke: "none",
          }));
          cnt++;
        }
      // 网格线
      for (let i = 0; i <= n; i++) {
        svg.appendChild(el("line", { x1: ox + i * cell, y1: oy, x2: ox + i * cell, y2: oy + n * cell, stroke: "#f0ebe1", "stroke-width": 1 }));
        svg.appendChild(el("line", { x1: ox, y1: oy + i * cell, x2: ox + n * cell, y2: oy + i * cell, stroke: "#f0ebe1", "stroke-width": 1 }));
      }
      vis.appendChild(svg);
      rv.textContent = n + "×" + n + " 方格";

      out.innerHTML =
        "<b>" + n + "×" + n + " 的方格里，斜边能画出 <b>" + cnt + "</b> 个不同的直角三角形。</b><br>" +
        "继续往下看序列：<b>0, 1, 3, 6, 10, 15, 21, 28, 36, 45 …</b><br>" +
        "它就是 <b>1+2+3+…+n = n(n+1)/2</b>，也就是<b>三角形数</b>。<br>" +
        "<span style='color:#c4622d'><strong>「数」是数出来的，「形」是画出来的，但它们说的是同一件事</strong>——这就是数形结合。</span>";
    }
    on("sx-r", "input", () => { rv.textContent = ""; go(); });
    go();
  }

  /* ======================================================================
     ⑨ 鸽巢问题（抽屉原理）—— 多一个，就一定有碰撞
     ====================================================================== */
  function geziDemo() {
    const host = $("gz-demo"); if (!host) return;
    const out = $("gz-out"), vis = $("gz-vis");
    const nIn = $("gz-n");

    function go() {
      const holes = +nIn.value;
      const balls = holes + 2;
      vis.innerHTML = "";
      const W = 640, H = 190;
      const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%" });
      // 抽屉
      const bw = Math.min(120, (W - 40) / holes - 10);
      const startX = 20, gap = (W - 40 - holes * bw) / Math.max(1, holes - 1) + bw;
      for (let i = 0; i < holes; i++) {
        const x = startX + i * gap;
        svg.appendChild(el("path", {
          d: `M${x} 60 h${bw} v70 h${-bw} z`, fill: "#e8f1ec", stroke: "#2f6b52", "stroke-width": 2,
        }));
        const t = el("text", { x: x + bw / 2, y: 152, "text-anchor": "middle", "font-size": 12, fill: "#5c554d" });
        t.textContent = "抽屉" + (i + 1);
        svg.appendChild(t);
      }
      // 球：先每洞1个，多的都塞1号
      let placed = [];
      for (let i = 0; i < holes; i++) placed.push(1);
      for (let i = holes; i < balls; i++) placed[0]++;
      placed.forEach((cnt, i) => {
        const x = startX + i * gap + bw / 2;
        for (let k = 0; k < cnt; k++) {
          svg.appendChild(el("circle", {
            cx: x, cy: 78 + k * 17, r: 8,
            fill: cnt > 1 ? "#c4622d" : "#6aa287", stroke: "#fff", "stroke-width": 1.5,
          }));
        }
        if (cnt > 1) {
          const t = el("text", { x, y: 44, "text-anchor": "middle", "font-size": 12, fill: "#c4622d", "font-weight": 700 });
          t.textContent = cnt + " 个";
          svg.appendChild(t);
        }
      });
      vis.appendChild(svg);
      out.innerHTML =
        "<b>" + holes + " 个抽屉，放进 " + balls + " 个球</b>（比抽屉多 " + (balls - holes) + " 个）。<br>" +
        "结果：<b>至少有一个抽屉里，装了 2 个或更多球</b>。<br>" +
        "这跟球长什么样、抽屉是大是小<strong>一点关系都没有</strong>——它是<strong>必然</strong>，不是可能。<br>" +
        "<span style='color:#c4622d'><strong>n 个抽屉放 n+1 个物体，必定有一个抽屉里至少 2 个。</strong>" +
        "反过来记：<strong>要保证「互不相同」，抽屉数必须比物体数多</strong>。</span>";
    }
    on("gz-n", "input", go);
    go();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    paipeiDemo(); tuiliDemo(); jiheDemo(); youhuaDemo(); jituDemo();
    zhishuDemo(); zhaocipinDemo(); shuxingDemo(); geziDemo();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
