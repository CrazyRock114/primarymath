#!/usr/bin/env python3
"""第二轮修复：第三方验收遗留清单中经核实属实的项。"""
import os, re, sys

SITE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")

FIXES = [
    # ═══ P0-1 TOC 漏改：标题已是「差 10 倍」，目录还写「差 100 倍」═══
    ("fraction/decimal.html",
     '<li><a href="#l1">01 12.3 和 123，差 100 倍</a></li>',
     '<li><a href="#l1">01 12.3 和 123，差 10 倍</a></li>'),

    # ═══ P2-6 首页批次卡片：B1 排在最后，应在首位 ═══
    ("pillar/number.html",
     '<h2 id="quiz"><span class="num">✓</span>练一练：孩子真的懂了吗</h2>',
     '<h2><span class="num">✓</span>练一练：孩子真的懂了吗</h2>'),
    ("pillar/number.html",
     '<div class="quiz" data-quiz="pillar-number"></div>',
     '<div class="quiz" id="quiz" data-quiz="pillar-number"></div>'),

    # ═══ P2-7 SVG 文本里塞了 HTML 标签，SVG 不解析，会原样显示 ═══
    ("assets/js/frac2.js",
     'T(x0, 226, "问：这里装着 <b>几个 1/2</b>？→ "',
     'T(x0, 226, "问：这里装着 几个 1/2 ？→ "'),
    ("assets/js/frac2.js",
     '"用乘法验算：<b>" + q + " × 1/2 = 0.75 = 3/4 ✓</b>"',
     '"用乘法验算： " + q + " × 1/2 = 0.75 = 3/4 ✓"'),
    ("assets/js/frac2.js",
     'T(x0, 58, "那 <b>3/4 × ? = 3/4</b> —— 问号该填几？"',
     'T(x0, 58, "那 3/4 × ? = 3/4 —— 问号该填几？"'),
    ("assets/js/frac2.js",
     '"多乘的 <b>" + c + "/" + d + "</b> 就必须被 <b>除以同样的 " + c + "/" + d + "</b> 抵消掉"',
     '"多乘的 " + c + "/" + d + " 就必须被 除以同样的 " + c + "/" + d + " 抵消掉"'),
    ("assets/js/frac2.js",
     '"除以 " + c + "/" + d + " = 乘 1 ÷ " + c + "/" + d + " = 乘 <b>" + d + "/" + c + "</b>（倒数）"',
     '"除以 " + c + "/" + d + " = 乘 1 ÷ " + c + "/" + d + " = 乘 " + d + "/" + c + "（倒数）"'),

    # ═══ P2-11 术语：展示的是因数配对，不是质因数配对 ═══
    ("assets/js/fraction.js",
     '// 质因数配对\n',
     '// 因数配对\n'),
    ("assets/js/fraction.js",
     'T(20, 120, "质因数配对：", { "font-size": 14, "font-weight": 700, fill: "#2b2723" })',
     'T(20, 120, "因数配对：", { "font-size": 14, "font-weight": 700, fill: "#2b2723" })'),

    # ═══ P2-14「人可以不呼吸」被标为「一定」不成立（憋气是可能不是必然）═══
    ("assets/js/stats.js",
     '{ t: "一定", s: "人可以不呼吸（憋气）", ok: true, c: "#2f6b52" },',
     '{ t: "一定", s: "明天太阳从东边升起", ok: true, c: "#2f6b52" },'),
    ("assets/js/stats.js",
     '"「人可以不呼吸」——<b>一定</b>会发生（这是必然）<br>" +',
     '"「明天太阳从东边升起」——<b>一定</b>会发生（这是必然）<br>" +'),

    # ═══ 404 页用了 site.css 里不存在的 .lead ═══
    ("404.html",
     '<p class="lead">多半是链接输错了，或者页面改名了。可以从下面两个入口重新找。</p>',
     '<p>多半是链接输错了，或者页面改名了。可以从下面两个入口重新找。</p>'),
]


def main() -> int:
    ok = miss = 0
    for rel, old, new in FIXES:
        p = os.path.join(SITE, rel)
        if not os.path.exists(p):
            print(f"  ✗ 文件不存在 {rel}"); miss += 1; continue
        s = open(p, encoding="utf-8").read()
        if old not in s:
            print(f"  ✗ 未命中 {rel}\n      找: {old[:72]}"); miss += 1; continue
        if s.count(old) > 1:
            print(f"  ⚠️ {rel} 出现 {s.count(old)} 次，只改第一处")
        open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))
        print(f"  ✓ {rel}  {old[:56]}")
        ok += 1
    print(f"\n修复 {ok} 条，未命中 {miss} 条，共 {len(FIXES)} 条")
    return 1 if miss else 0


if __name__ == "__main__":
    sys.exit(main())
