/* ==========================================================================
   quiz.js —— 练习判题引擎
   ---------------------------------------------------------------------------
   判定对象是"孩子的理解"而不是"孩子的记性"，所以：
   · 答错时反馈里必须说清"孩子此刻脑子里的模型是什么"
   · 每题可带 kidSay（家长可以直接念给孩子的一句话）
   · 答错不扣分、只解释，全对才给"过关"标记
   用法：
     <div class="quiz" data-quiz="equal-1"></div>
   题目定义在同页 <script>window.QUIZES['equal-1'] = {...}</script>
   ========================================================================== */
(function () {
  "use strict";

  const LS_KEY = "pm-quiz-progress";

  /* ---------- 进度存档（跨页面保留做题记录） ---------- */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function markDone(id, right, total) {
    const p = loadProgress();
    p[id] = { right, total, at: Date.now() };
    saveProgress(p);
    renderBadges();
  }

  /* ---------- 顶部/侧栏进度徽标 ---------- */
  function renderBadges() {
    const p = loadProgress();
    document.querySelectorAll("[data-quiz-badge]").forEach((el) => {
      const id = el.getAttribute("data-quiz-badge");
      if (p[id]) {
        el.textContent = p[id].right + "/" + p[id].total;
        el.classList.add("done");
      } else {
        el.textContent = "";
        el.classList.remove("done");
      }
    });
  }

  /* ---------- 判定 ---------- */
  /**
   * 支持三种题型：
   *   type:"choice"  单选，answer 为正确选项的 k
   *   type:"multi"   多选，answer 为正确选项 k 的数组
   *   type:"input"   填空，answer 为字符串数组（任一匹配即对，自动去空格/全角）
   * 说明：判错时永远展示 kidSay，这是家长最需要的一句台词。
   */
  function judge(q, userKey) {
    const a = q.answer;
    if (q.type === "multi") {
      const got = (userKey || []).slice().sort().join(",");
      const want = a.slice().sort().join(",");
      return { ok: got === want, got, want };
    }
    if (q.type === "input") {
      const norm = (s) => String(s == null ? "" : s)
        .replace(/\s+/g, "")
        .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
        .replace(/[，、]/g, ",");
      const u = norm(userKey);
      const ok = a.some((x) => norm(x) === u);
      return { ok, got: userKey, want: a.join(" 或 ") };
    }
    return { ok: userKey === a, got: userKey, want: a };
  }

  /* ---------- 渲染 ---------- */
  function renderQuiz(host) {
    const id = host.getAttribute("data-quiz");
    const def = (window.QUIZES || {})[id];
    if (!def) { host.innerHTML = '<p class="note">题目未定义：' + id + "</p>"; return; }

    const saved = loadProgress()[id];
    let answered = 0, right = 0;

    const head =
      '<div class="quiz-h"><h3>' + def.title + "</h3>" +
      '<span class="quiz-score">答对 <b data-score>0</b>/' + def.qs.length + "</span></div>";

    let body = "";
    def.qs.forEach((q, i) => {
      let ctrl = "";
      if (q.type === "choice" || !q.type) {
        ctrl =
          '<div class="opts">' +
          q.opts.map((o, j) => {
            const k = String.fromCharCode(65 + j);
            return '<div class="opt" data-k="' + k + '"><span class="opt-k">' + k + "</span><span>" + o + "</span></div>";
          }).join("") +
          "</div>";
      } else if (q.type === "multi") {
        ctrl =
          '<div class="opts" data-multi="1">' +
          q.opts.map((o, j) => {
            const k = String.fromCharCode(65 + j);
            return '<div class="opt" data-k="' + k + '"><span class="opt-k">' + k + "</span><span>" + o + "</span></div>";
          }).join("") +
          "</div><p style=\"font-size:13.5px;color:var(--ink-faint);margin:8px 0 0\">可多选</p>";
      } else if (q.type === "input") {
        ctrl =
          '<div class="demo-ctrl" style="margin-top:4px">' +
          '<input type="text" class="quiz-in" placeholder="' + (q.ph || "写答案") + '" ' +
          'style="flex:1;min-width:150px;font-family:inherit;font-size:16px;padding:9px 13px;' +
          'border:1.5px solid var(--line);border-radius:9px;background:#fff" ' +
          'data-in><button class="btn btn-primary" data-submit>确定</button></div>';
      }

      body +=
        '<div class="q" data-q="' + i + '">' +
        '<div class="q-stem"><span class="qn">' + (i + 1) + "</span>" + q.stem + "</div>" +
        ctrl +
        '<div class="fb" data-fb></div>' +
        "</div>";
    });

    host.innerHTML = head + body +
      '<div class="quiz-foot">' +
      '<span class="quiz-verdict" data-verdict></span>' +
      '<button class="btn" data-retry hidden>重做一遍</button>' +
      "</div>";

    if (saved) {
      host.querySelector('[data-score]').textContent = saved.right;
    }

    bind(host, def, id, function (n, r) {
      answered = n; right = r;
      host.querySelector('[data-score]').textContent = r;
    });
  }

  /* ---------- 交互绑定 ---------- */
  function bind(host, def, quizId, onScore) {
    function lock(qEl) { qEl.querySelectorAll(".opt").forEach((o) => o.classList.add("locked")); }

    function finish(q, qEl, res) {
      const fb = qEl.querySelector("[data-fb]");
      if (q.type === "input") {
        qEl.querySelector("[data-in]").disabled = true;
        const b = qEl.querySelector("[data-submit]");
        if (b) b.disabled = true;
      } else {
        lock(qEl);
        const key = res.got != null && (Array.isArray(res.got) ? res.got : [res.got]);
        qEl.querySelectorAll(".opt").forEach((o) => {
          const k = o.getAttribute("data-k");
          if (Array.isArray(q.answer)) { if (q.answer.indexOf(k) >= 0) o.classList.add("right"); }
          else if (k === q.answer) o.classList.add("right");
        });
        if (!res.ok && key[0]) {
          const w = qEl.querySelector('.opt[data-k="' + key[0] + '"]');
          if (w) w.classList.add("wrong");
        }
      }

      fb.className = "fb show " + (res.ok ? "ok" : "no");
      const head = res.ok ? "✓ 答对了" : "✗ 再看一下";
      const explain = res.ok
        ? (q.why || "")
        : (q.miss || (q.why ? "正确答案：<b>" + fmtAns(q) + "</b>。 " + q.why : ""));
      const say = q.kidSay
        ? '<div style="margin-top:9px;padding-top:9px;border-top:1px dashed ' +
          (res.ok ? "#cfe2d8" : "#f0d4c0") + '">家长可以这样说：<b style="color:var(--brand-dk)">' +
          q.kidSay + "</b></div>"
        : "";
      fb.innerHTML = '<div class="fh">' + head + "</div>" + explain + say;
    }

    def.qs.forEach((q, i) => {
      const qEl = host.querySelector('[data-q="' + i + '"]');
      if (!qEl) return;
      let done = false;

      if (q.type === "input") {
        const inp = qEl.querySelector("[data-in]");
        const go = () => {
          if (done || !inp.value.trim()) return;
          done = true;
          const res = judge(q, inp.value.trim());
          finish(q, qEl, res);
          onScore(countOK(host, def), countDone(host, def));
          verdict(host, def, quizId);
        };
        qEl.querySelector("[data-submit]").addEventListener("click", go);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
      } else {
        const multi = q.type === "multi";
        const picked = new Set();
        qEl.querySelectorAll(".opt").forEach((o) => {
          o.addEventListener("click", () => {
            if (done) return;
            const k = o.getAttribute("data-k");
            if (multi) {
              if (picked.has(k)) { picked.delete(k); o.classList.remove("sel"); }
              else { picked.add(k); o.classList.add("sel"); }
            } else {
              qEl.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel"));
              picked.clear(); picked.add(k);
              o.classList.add("sel");
              done = true;
              const res = judge(q, k);
              finish(q, qEl, res);
              onScore(countOK(host, def), countDone(host, def));
              verdict(host, def, quizId);
            }
          });
        });
        if (multi) {
          const b = document.createElement("button");
          b.className = "btn btn-primary";
          b.textContent = "提交";
          b.style.marginTop = "10px";
          b.addEventListener("click", () => {
            if (done || !picked.size) return;
            done = true;
            const arr = Array.from(picked);
            const res = judge(q, arr);
            finish(q, qEl, res);
            onScore(countOK(host, def), countDone(host, def));
            verdict(host, def, quizId);
          });
          qEl.querySelector(".opts").after(b);
        }
      }
    });

    const retry = host.querySelector("[data-retry]");
    if (retry) {
      retry.addEventListener("click", () => {
        const p = loadProgress();
        delete p[quizId]; saveProgress(p);
        renderQuiz(host);
      });
    }
  }

  function fmtAns(q) {
    if (Array.isArray(q.answer)) return q.answer.join("、");
    return q.answer;
  }
  function countDone(host, def) { return host.querySelectorAll(".fb.show").length; }
  function countOK(host, def) { return host.querySelectorAll(".fb.ok").length; }

  function verdict(host, def, quizId) {
    const n = countDone(host, def);
    if (n < def.qs.length) return;
    const r = countOK(host, def);
    const v = host.querySelector("[data-verdict]");
    const btn = host.querySelector("[data-retry]");
    if (r === def.qs.length) {
      v.className = "quiz-verdict pass";
      v.innerHTML = "全部答对 —— 这一节的概念，可以带进下一节了。";
      markDone(quizId, r, def.qs.length);
    } else {
      v.className = "quiz-verdict mid";
      v.innerHTML = "答对 " + r + "/" + def.qs.length + "。错的题请把上面的<b>「家长可以这样说」</b>念给孩子听一遍，再做一次。";
      markDone(quizId, r, def.qs.length);
    }
    if (btn) btn.hidden = false;
  }

  /* ---------- 启动 ---------- */
  function boot() {
    document.querySelectorAll("[data-quiz]").forEach(renderQuiz);
    renderBadges();

    // 顶栏当前项高亮
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".topbar nav a").forEach((a) => {
      if (a.getAttribute("href") === here) a.classList.add("on");
    });

    // 回到顶部
    const toTop = document.getElementById("totop");
    if (toTop) {
      window.addEventListener("scroll", () => {
        toTop.style.opacity = window.scrollY > 600 ? "1" : "0";
      }, { passive: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
