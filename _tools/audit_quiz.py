#!/usr/bin/env python3
"""题库审计：答案键是否与选项、解析自洽。

自动能查的：
  1. answer 键是否落在选项范围内
  2. 选项是否有完全重复
  3. answer 指向的选项，是否和 why 的说法一致（内容词重合度）
  4. 解析/台词是否为空
自动查不了的（交人审）：why 的推理本身对不对。
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")

# 题库对象抽取：window.QUIZES["id"]={title:...,qs:[ {...},{...} ]}
Q_RE = re.compile(r"\{\s*stem\s*:", re.S)
OPT_RE = re.compile(r'opts\s*:\s*\[(.*?)\]\s*,\s*answer', re.S)
STR_RE = re.compile(r'"((?:[^"\\]|\\.)*)"')


def strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s).replace("&nbsp;", " ").strip()


def words(s: str):
    """中文按 2-gram 切，便于做重合度比较。"""
    t = strip_html(s)
    t = re.sub(r"[^一-鿿A-Za-z0-9]", "", t)
    return {t[i:i + 2] for i in range(len(t) - 1)} or {t}


def field(block: str, name: str):
    m = re.search(rf'\b{name}\s*:\s*"((?:[^"\\]|\\.)*)"', block)
    return m.group(1) if m else None


def main() -> int:
    files = sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True))
    total = bad = weak = 0
    issues = []

    for p in files:
        rel = os.path.relpath(p, SITE)
        s = open(p, encoding="utf-8").read()
        starts = [m.start() for m in Q_RE.finditer(s)]
        for i, st in enumerate(starts):
            blk = s[st: (starts[i + 1] if i + 1 < len(starts) else len(s))]
            total += 1
            stem = strip_html(field(blk, "stem") or "")
            ans = field(blk, "answer")
            why = field(blk, "why") or ""
            miss = field(blk, "miss") or ""
            kid = field(blk, "kidSay") or ""
            om = OPT_RE.search(blk)
            opts = [strip_html(x) for x in STR_RE.findall(om.group(1))] if om else []

            def flag(msg):
                issues.append((rel, stem[:34], msg))

            if not om or not opts:
                flag("选项解析失败"); continue
            if not ans or ans not in "ABCD" or "ABCD".index(ans) >= len(opts):
                flag(f"答案键 {ans!r} 越界(共{len(opts)}个选项)"); continue
            if len(set(opts)) != len(opts):
                flag("存在完全重复的选项")
            if not (why.strip() and miss.strip() and kid.strip()):
                flag("解析/答错反馈/家长台词有空字段")

            # 答案选项 vs 解析 的内容重合度
            k = "ABCD".index(ans)
            aw = words(opts[k])
            ww = words(why)
            cover = len(aw & ww) / max(len(aw), 1)
            # 干扰项与解析的重合度不应高于正确项太多
            others = [words(o) for j, o in enumerate(opts) if j != k]
            best_other = max((len(o & ww) / max(len(o), 1) for o in others), default=0)
            if cover < 0.12 and best_other > cover + 0.15:
                weak += 1
                flag(f"答案项与解析不吻合(答案项覆盖{cover:.0%}, 干扰项{best_other:.0%})——需人工确认")

    for r, st, msg in issues:
        kind = "⚠️" if "人工确认" in msg else "✗"
        print(f"  {kind} {r}  |  {st}  |  {msg}")
    print("=" * 64)
    print(f"题目总数 {total} · 结构性错误 {bad} · 需人工确认 {weak}")
    print("✅ 题库结构与答案键无问题" if not issues else f"共 {len(issues)} 条待处理")
    return 1 if any("人工确认" not in m for _, _, m in issues) else 0


if __name__ == "__main__":
    sys.exit(main())
