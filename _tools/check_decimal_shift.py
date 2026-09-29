#!/usr/bin/env python3
"""小数点移动方向守卫 —— 专门盯这一类"结论正确但口诀写反"的错误。

**为什么需要它**：2026-09-29 我驳回了第三方报告里"小数点方向教反了"这条，
理由是自己的验算脚本。**但那个脚本把标签写反了**：
    print('0.35 左移 →', 0.35*10)   # ×10 其实是右移的效果
    print('0.35 右移 →', 0.35/10)   # ÷10 其实是左移的效果
用标签颠倒的算式去"验证"，等于自我印证了错误结论，站点把口诀教反了，
还顺利通过了我的全部回归。

**教训**：验证脚本本身也必须被独立验证。口诀类结论不能靠"读起来顺"判断，
必须回到数值算。
"""
import glob, os, re, sys
from decimal import Decimal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")

# 唯一正确的规则（人教版四下）
RIGHT_GROWS = True   # 右移一位 → 变大 10 倍


def expected(word: str) -> str:
    """给出该方向下应有的结论。"""
    grows = RIGHT_GROWS if word in ("右", "往右") else not RIGHT_GROWS
    return "变大" if grows else "变小"


def numeric_probe() -> None:
    """先用数值自证这条规则本身是对的，防止守卫本身写反。"""
    for src, shift_right in (("0.35", Decimal("3.5")), ("12.3", Decimal("123")),
                             ("0.75", Decimal("7.5")), ("2.4", Decimal("24"))):
        left = Decimal(src) / 10
        assert shift_right == Decimal(src) * 10, f"右移算错: {src}"
        assert shift_right > Decimal(src), f"{src} 右移应变大"
        assert left < Decimal(src), f"{src} 左移应变小"
    print("  规则自证：0.35→3.5 变大、0.35→0.035 变小、12.3→123 变大 ✅")


def main() -> int:
    print("=" * 64)
    print("小数点移动方向守卫")
    print("=" * 64)
    numeric_probe()

    # 匹配「右移/往右/向右 … 变大/变小」这类口诀句。
    # 关键：先剥掉行内 HTML 标签再匹配——方向词与结论词之间常隔着
    # </strong>，若在原串上用 [^<] 匹配会整条漏掉，守卫就成了摆设。
    CLAIM = re.compile(r"(向右|往右|右移)([^。\n]{0,60}?)(变大|变小)"
                       r"|(向左|往左|左移)([^。\n]{0,60}?)(变大|变小)")
    TAG = re.compile(r"<[^>]*>")
    # 「计数单位/单位/位值」变小是**另一回事**（小数点右侧 0.1>0.01>0.001，
    # 但每个单位本身比左边小），不是数值变大变小，不能混判。误报过一次，加白名单。
    UNIT_WORD = re.compile(r"单位|位值|每一份|份开始")
    ERR_EX = re.compile(r"""class=['"]err-ex['"]>.*?</(?:span|p)>""", re.S)

    bad = 0
    scanned = 0
    for p in sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True)) + \
             sorted(glob.glob(os.path.join(SITE, "assets", "js", "*.js"))):
        raw = open(p, encoding="utf-8").read()
        rel = os.path.relpath(p, SITE)
        # class="err-ex" = 故意引用的错误说法（教材反例素材），不是站点断言
        raw = ERR_EX.sub("", raw)
        lines = raw.split("\n")
        for ln, line in enumerate(lines, 1):
            plain = TAG.sub("", line)          # ← 剥标签后再匹配
            for m in CLAIM.finditer(plain):
                whole = m.group(0)
                if UNIT_WORD.search(whole):
                    continue          # 说的是单位大小，跳过
                if m.group(1):
                    word, got = "右", m.group(3)
                else:
                    word, got = "左", m.group(6)
                want = expected(word)
                scanned += 1
                if got != want:
                    print(f"  ✗ {rel}:{ln}  {word}移写成「{got}」，应为「{want}」")
                    print(f"      {whole[:78]}")
                    bad += 1
    print(f"\n  扫描 {scanned} 处数值方向口诀 · 判错 {bad} 处")
    print("  ✅ 小数点移动方向全部正确" if not bad else "")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
