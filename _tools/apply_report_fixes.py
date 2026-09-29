#!/usr/bin/env python3
"""按核验结论修复报告中的 HTML 层缺陷。逐条精确串替换，未命中即报告。"""
import os, sys

SITE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")

FIXES = [
    # ═══ P0-5 竖式 40×234 = 2340 → 9360（4 处）═══
    ("rule/vertical.html",
     "因为 4 在十位上，它表示 40 个 234，而 40×234=2340，末位落在十位",
     "因为 4 在十位上，它表示 40 个 234，而 40×234=9360，末位落在十位"),
    ("rule/vertical.html",
     "用十位 4 去乘，表示「40 个 234」= 2340，末位在十位。",
     "用十位 4 去乘，表示「40 个 234」= 9360，末位在十位。"),
    ("rule/vertical.html",
     "40×234=2340，所以末位要对十位。",
     "40×234=9360，所以末位要对十位。"),
    ("rule/vertical.html",
     "40 个 234 是 2340，它的末位就在十位上。",
     "40 个 234 是 9360，它的末位就在十位上。"),
    ("rule/vertical.html",
     "而 <strong>40 个 234 的末位落在十位</strong> —— 因为 10 × 234 = 2340。",
     "而 <strong>40 个 234 的末位落在十位</strong> —— 因为 40 × 234 = 9360，正好比 234 多一位。"),

    # ═══ P0-4 封闭植树：棵数 = 间隔数（页面总结表格）═══
    ("guangle/zhishu.html",
     "<td style=\"padding:11px 16px\">间隔数 × 2</td><td style=\"padding:11px 16px;color:var(--ink-soft)\">每个坑两侧各站一棵</td>",
     "<td style=\"padding:11px 16px\">间隔数</td><td style=\"padding:11px 16px;color:var(--ink-soft)\">围成一圈没有首尾，最后一个间隔的终点就是第一个坑，一坑一树</td>"),

    # ═══ P0-1（真错误部分）0.35 的 3 在十分位，不是百分位 ═══
    ("fraction/decimal.html",
     "<span class=\"m\">0.35</span> 的 3 在<strong>百分位</strong>，表示 3 个 0.01。",
     "<span class=\"m\">0.35</span> 的 3 在<strong>十分位</strong>，表示 3 个 0.1（5 才在百分位）。"),
    ("fraction/decimal.html",
     "why:\"<span class='m'>0.35</span> 的 3 在<strong>百分位</strong>；小数点右移一位后，3 到了<strong>千分位</strong>，从「3 个 0.01」变成「3 个 0.001」",
     "why:\"<span class='m'>0.35</span> 的 3 在<strong>十分位</strong>；小数点右移一位后，3 到了<strong>千分位</strong>，从「3 个 0.1」变成「3 个 0.001」"),
    ("fraction/decimal.html",
     "小数点<strong>右移</strong>一位 → 3 跑到<strong>千分位</strong>，变成 3 个 0.001 → <strong>变小 10 倍</strong>。",
     "小数点<strong>右移</strong>一位 → 3 跑到<strong>千分位</strong>，变成 3 个 0.001 → <strong>变小 10 倍</strong>。"),
    ("fraction/decimal.html",
     "kidSay:\"往右移，单位从百分位变千分位，每份更小了，所以总数也变小。\"",
     "kidSay:\"往右移，单位从十分位变千分位，每份更小了，所以总数也变小。\""),

    # ═══ P1-1 优化演示缺 yh-rv，拖动即 TypeError ═══
    ("guangle/youhua.html",
     "<input type=\"range\" id=\"yh-r\" min=\"1\" max=\"6\" value=\"2\"><span class=\"val\">2</span>分钟",
     "<input type=\"range\" id=\"yh-r\" min=\"1\" max=\"6\" value=\"2\"><span class=\"val\" id=\"yh-rv\">2</span>分钟"),

    # ═══ P1-6 面包屑与本页标题错配 ═══
    ("multiply/place.html",
     "<a href=\"index.html\">乘除的结构</a><a href=\"dive.html\">数位表里的算理</a>",
     "<a href=\"index.html\">乘除的结构</a><a href=\"place.html\">数位表里的算理</a>"),
    ("multiply/dive.html",
     "<a href=\"index.html\">乘除的结构</a><a href=\"dive.html\">数位表里的算理</a>",
     "<a href=\"index.html\">乘除的结构</a><a href=\"dive.html\">乘法是加法的打包</a>"),

    # ═══ P2-5 页脚「B13 批次完」重复 ═══
    ("pattern/rule.html",
     "回到首页</a>　|　B13 批次完　|　B13 批次完",
     "回到首页</a>　|　B13 批次完"),

    # ═══ P1-3 鸡兔同笼 20 头 100 腿无解 → 改用可解数据 76 腿 ═══
    ("guangle/jitu.html",
     "孩子学会了「假设全是鸡」，遇到「20 个头，100 条腿」照样懵——",
     "孩子学会了「假设全是鸡」，遇到「20 个头，76 条腿」照样懵——"),
    ("guangle/jitu.html",
     "因为假设全是鸡算出 40 条，比实际的 100 条<strong>少</strong>，越调越不够。",
     "因为假设全是鸡算出 40 条，比实际的 76 条<strong>少</strong>，要换成兔才够。"),
    ("guangle/jitu.html",
     "20 × 4 = 80 条腿，比 100 少 20 条。每换 1 只兔成鸡，<strong>少 2 条</strong>，20÷2 = 10 只鸡。",
     "20 × 4 = 80 条腿，比 76 多 4 条。每换 1 只兔成鸡，<strong>少 2 条</strong>，4÷2 = 2 只鸡。"),
    ("guangle/jitu.html",
     "{stem:\"「20 个头、100 条腿」用假设法应该怎么开始？\"",
     "{stem:\"「20 个头、76 条腿」用假设法应该怎么开始？\""),
    ("guangle/jitu.html",
     "why:\"假设全鸡得 20×2=40 条，比实际 100 <strong>少很多</strong>，说明鸡不可能这么多腿。这时该反着假设<strong>全是兔</strong>：20×4=80，比 100 少 20，每只兔换鸡少 2 条腿，20÷2=10 只鸡。\"",
     "why:\"假设全鸡得 20×2=40 条，比实际 76 <strong>少 36 条</strong>，腿不够。这时该反着假设<strong>全是兔</strong>：20×4=80，比 76 多 4，每换 1 只兔成鸡少 2 条腿，4÷2=2 只鸡，兔 = 18 只。\""),

    # ═══ P1-4 集合 Q3 多解：三个互斥选项都能选 ═══
    ("guangle/jihe.html",
     "opts:[\"男生 20 人，女生 18 人\",\"喜欢苹果 15 人，喜欢香蕉 12 人，其中 5 人都喜欢\",\"一班 30 人，二班 28 人\",\"红球 8 个，黄球 6 个\"],\n answer:\"D\",why:\"红球和黄球是<strong>互斥的两类</strong>，不可能同一颗球既是红又是黄，所以直接相加。苹果香蕉那题有 5 人重叠，必须减。\"",
     "opts:[\"男生 20 人，女生 18 人\",\"喜欢苹果 15 人，喜欢香蕉 12 人，其中 5 人都喜欢\",\"男生 12 人，喜欢足球 10 人，其中 8 个男生喜欢足球\",\"红球 8 个，黄球 6 个\"],\n answer:\"D\",why:\"红球和黄球是<strong>互斥的两类</strong>，不可能同一颗球既是红又是黄，所以直接相加。苹果香蕉那题有 5 人重叠，<strong>男生和喜欢足球也有 8 人重叠</strong>，都必须减。\""),
    ("guangle/jihe.html",
     "miss:\"关键判断：<b>这两类会不会有同一个东西？</b>红球和黄球绝不会重叠，男生女生也绝不会。苹果香蕉会。\"",
     "miss:\"关键判断：<b>这两类会不会有同一个东西？</b>红球和黄球绝不会重叠，男生女生也绝不会。苹果香蕉、男生和足球都会。\""),
    ("guangle/jihe.html",
     "kidSay:\"先问一句：有没有人既是男的又是女的？或者同一颗球既是红的又是黄的？没有，才能直接加。\"",
     "kidSay:\"先问一句：同一颗球会不会既是红的又是黄的？不会，才能直接加。但喜欢苹果的人里面也有喜欢香蕉的，就得减掉。\""),

    # ═══ P1-7 TOC 死锚 3 处 ═══
    ("guangle/shuxing.html",
     "<h2><span class=\"num\">03</span>",
     "<h2 id=\"l3\"><span class=\"num\">03</span>"),
    ("multiply/divide.html",
     "<h2><span class=\"num\">04</span>",
     "<h2 id=\"l4\"><span class=\"num\">04</span>"),
    ("pattern/rule.html",
     "<h2><span class=\"num\">04</span>",
     "<h2 id=\"l4\"><span class=\"num\">04</span>"),
]


def main() -> int:
    ok = miss = 0
    for rel, old, new, *_ in FIXES:
        p = os.path.join(SITE, rel)
        s = open(p, encoding="utf-8").read()
        if old not in s:
            print(f"  ✗ 未命中 {rel}\n      找: {old[:75]}")
            miss += 1
            continue
        if s.count(old) > 1:
            print(f"  ⚠️ {rel} 出现 {s.count(old)} 次，只改第一处")
        open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))
        print(f"  ✓ {rel}  {old[:52]}")
        ok += 1
    print(f"\n修复 {ok} 条，未命中 {miss} 条，共 {len(FIXES)} 条")
    return 1 if miss else 0


if __name__ == "__main__":
    sys.exit(main())
