#!/usr/bin/env python3
"""站点数学断言自动验算：把页面里所有 `a op b = c` 形式的算式真算一遍。

设计要点（第一版误报太多，这几点是踩出来的）：
  * 分数 3/4 是一个整体记号，不是「3 除以 4」；÷ 才是除法。必须先分词再算。
  * 单位词 / 量词（千克、个、万、元……）参与语义，人算，自动跳过。
  * 带分数 2又1/3 要在剥中文之前先识别。
  * 余数写法 17÷5=3……2 要单独走「被除数=除数×商+余数」的判定。
只报"算错了"的，不报"写得对不对"——后者交给人审。
"""
import glob, os, re, sys
from fractions import Fraction

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")

# 出现这些词就说明式子里带单位/量词，机器判不了，直接跳过
UNIT = re.compile(
    r"万|亿|个|位|只|条|张|支|辆|本|棵|朵|人|元|角|千克|公斤|克|吨|斤|两|"
    r"米|里|千米|公里|时|秒|天|年|月|日|度|周|次|倍|份|页|本"
)
# 约等号 / 循环小数
APPROX = "≈…约"

OPS = {"+": "+", "-": "-", "*": "*", "@": "/"}


def split_equations(text: str):
    """把 `3=1+2，6=1+2+3` 拆成独立算式。"""
    return [x for x in re.split(r"[，,；;]", text) if "=" in x]


def eval_expr(s: str):
    """分词后求值：分数记号整体算，÷ 当除法。算不了返回 None。"""
    if any(c in s for c in APPROX):          # 循环小数/约等，机器判不了
        return None
    s = s.replace("×", "*").replace("÷", "@").replace("−", "-")
    s = s.replace("＋", "+").replace("＝", "=").replace("－", "-").replace("—", "-")
    s = s.replace("（", "(").replace("）", ")")   # 全角括号先转半角，保留分组语义

    # 剥掉带中文的括号注释 (0.5 就是 0.5)
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"[(（][^)）]*[\u4e00-\u9fff][^)）]*[)）]", "", s)

    # 带分数：2又1/3（数字与"又"之间可能有空格）
    s = re.sub(
        r"(-?\d+)\s*又\s*(\d+/\d+)",
        lambda m: "(" + str(Fraction(int(m.group(1))) + Fraction(m.group(2))) + ")",
        s,
    )

    # 剩余中文一律剥掉（半角括号是分组符，必须保留）
    s = re.sub(r"[\u4e00-\u9fff（）？！。，、；：""''《》…·\s]+", "", s)
    if not s or "?" in s:
        return None
    # 分词：分数记号 a/b 整体、十进制数、括号、运算符
    toks = re.findall(r"\d+/\d+|\d+(?:\.\d+)?|[()@*+\-]", s)
    if not toks:
        return None
    if "".join(toks) != s:      # 混进了解析不了的东西
        return None

    # 规约成 Python 表达式：小数/分数都用 Fraction 构造，避免浮点误差
    py = ""
    for t in toks:
        if "/" in t:
            n, d = t.split("/")
            py += f"(Fraction({n},{d}))"
        elif "." in t:
            py += f"(Fraction('{t}'))"
        else:
            py += t
    py = py.replace("@", "/")
    try:
        return Fraction(eval(py, {"__builtins__": {}, "Fraction": Fraction}, {}))  # noqa: S307
    except Exception:
        return None


def check_remainder(raw: str):
    """余数写法：17÷5=3……2  →  17 == 5*3+2 且 0<=2<5"""
    m = re.search(r"(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)\s*(?:……|\.\.)\s*(\d+)", raw)
    if not m:
        return None
    a, b, q, r = (int(x) for x in m.groups())
    if b == 0:
        return None
    ok = (a == b * q + r) and (0 <= r < b)
    return ok, f"{a}÷{b}={q}……{r}  应满足 {a}={b}×{q}+{r}，实算 {b*q+r}，余数需 <{b}"


# 小学阶段必须记牢的单位换算（换到基准单位后比对）
UNIT_BASE = {
    # 长度 → 米
    "毫米": 0.001, "厘米": 0.01, "分米": 0.1, "米": 1, "千米": 1000, "公里": 1000,
    # 质量 → 克
    "克": 1, "千克": 1000, "公斤": 1000, "吨": 1000000,
    # 时间 → 秒
    "秒": 1, "分": 60, "时": 3600, "天": 86400,
    # 人民币 → 分
    "分_币": 1, "角": 10, "元": 100,
    # 位值 → 一
    "一": 1, "十": 10, "百": 100, "千": 1000, "万": 10000, "千万": 10000000, "亿": 100000000,
    # 面积 → 平方米
    "平方厘米": 0.0001, "平方分米": 0.01, "平方米": 1, "公顷": 10000, "平方千米": 1000000,
    # 体积/容积 → 立方分米
    "立方厘米": 0.001, "毫升": 0.001, "立方分米": 1, "升": 1,
    "立方分米_": 1, "立方米": 1000,
}
DIM = {  # 同一维度才能比
    "长度": {"毫米", "厘米", "分米", "米", "千米", "公里"},
    "质量": {"克", "千克", "公斤", "吨"},
    "时间": {"秒", "分", "时", "天"},
    "货币": {"角", "元"},
    "位值": {"一", "十", "百", "千", "万", "千万", "亿"},
    "面积": {"平方厘米", "平方分米", "平方米", "公顷", "平方千米"},
    "体积": {"立方厘米", "毫升", "立方分米", "升", "立方米"},
}
U2D = {u: d for d, us in DIM.items() for u in us}
UNIT_NAMES = sorted(UNIT_BASE, key=len, reverse=True)
U_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(" + "|".join(UNIT_NAMES) + r")")


def check_unit(raw: str):
    """`1 千克 = 1000 克` 这类换算：换到基准单位后必须相等。"""
    parts = [p.strip() for p in re.split(r"[=＝]", raw) if p.strip()]
    if len(parts) < 2 or any("?" in p for p in parts):
        return None
    vals, units = [], []
    for p in parts:
        m = U_RE.fullmatch(p)
        if not m:                       # 只处理「N 单位」这种干净写法
            return None
        vals.append(Fraction(m.group(1)) * UNIT_BASE[m.group(2)])
        units.append(m.group(2))
    # 必须同一维度，且换算系数本身要自洽
    dims = {U2D.get(u) for u in units}
    if len(dims) != 1 or None in dims:
        return None
    if all(v == vals[0] for v in vals):
        return True, None
    return False, f"{raw}  换算后不等: {[str(v) for v in vals]}"


def check_one(raw: str):
    """返回 (是否可验, 是否错误, 详情)"""
    # 顺序要紧：带「……」的先按余数判，带单位词的先按换算判，
    # 否则剥掉中文后会当成 1 千克=1 这种假等式。
    r = check_remainder(raw)
    if r is not None:
        ok, msg = r
        return True, (not ok), ("余数", msg)

    if UNIT.search(raw):
        u = check_unit(raw)
        if u is not None:
            ok, msg = u
            return True, (not ok), ("单位", msg)
        return False, False, None   # 带单位但不是标准换算写法，交给人

    # 1) 通用算式验算
    eqs = split_equations(raw)
    verified = False
    for eq in eqs:
        parts = [x for x in re.split(r"[=＝]", eq) if x.strip()]
        if len(parts) < 2:
            continue
        vals = [eval_expr(p) for p in parts]
        if any(v is None for v in vals):
            continue  # 这条判不了，换下一条
        verified = True
        if any(v != vals[0] for v in vals[1:]):
            return True, True, ("算式", f"{eq.strip()}  实算 = {[str(v) for v in vals]}")
    # 关键：全部验算通过时也要算作「已验算」，不能掉到下面当成跳过
    return verified, False, None


def prose_only(s: str) -> str:
    """只保留讲解正文，剔除题库脚本。

    必须剔除的原因：题库里有大量**故意写错**的例子（`孩子算出 29÷4=6……5`、
    `5.2 米 = 52 厘米` 列为典型错误），那是教学素材不是站点断言，
    混进来会被误判成 bug。题库本身由 audit_quiz.py 单独审。
    """
    return re.sub(r"<script>[\s\S]*?</script>", "", s)


def main() -> int:
    files = sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True))
    checked = mismatch = skipped = 0
    problems = []

    for p in files:
        rel = os.path.relpath(p, SITE)
        full = open(p, encoding="utf-8").read()
        s = prose_only(full)
        # class="m err-ex" = 故意写错的示范（教材素材），不是站点断言，跳过
        s = re.sub(r"class=['\"]m err-ex['\"]>.*?</span>", "", s, flags=re.S)
        for m in re.finditer(r"class=['\"]m['\"]>(.*?)</span>", s, re.S):
            raw = re.sub(r"<[^>]+>", "", m.group(1)).strip()
            if not re.search(r"[=＝]", raw):
                skipped += 1
                continue
            ok, bad, detail = check_one(raw)
            if not ok:
                skipped += 1
                continue
            checked += 1
            if bad:
                mismatch += 1
                ln = s[: m.start()].count("\n") + 1
                problems.append((rel, ln, raw, detail))

    print("=" * 64)
    print("数学断言自动验算")
    print("=" * 64)
    print(f"  已验算 {checked} 条 · 跳过(含问号/字母公式/约等/判不了) {skipped} 条 · 判为错 {mismatch} 条")
    if problems:
        print("\n  ✗ 下列算式结果不自洽：")
        for rel, ln, raw, (kind, msg) in problems:
            print(f"    [{kind}] {rel}:{ln}   原文: {raw}")
            print(f"        {msg}")
    else:
        print("\n  ✅ 所有可验算的算式全部正确")
    return 1 if mismatch else 0


if __name__ == "__main__":
    sys.exit(main())
