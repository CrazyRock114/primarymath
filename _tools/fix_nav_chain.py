#!/usr/bin/env python3
"""按各目录 index.html 的 TOC 顺序，统一重建页脚「上一节/下一节」链。

为什么用脚本而不是逐页手改：手改 40+ 个页面极易漏和不对称，
而「A 的 next 是 B，则 B 的 prev 必须是 A」是纯机械约束，交给机器保证。
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")

TOC_ITEM = re.compile(r'<li><a href="([a-z0-9_-]+\.html)">([^<]*)</a></li>')


def toc_order(d: str):
    """从目录页的 toc 区块取顺序。"""
    idx = os.path.join(d, "index.html")
    if not os.path.exists(idx):
        return None
    s = open(idx, encoding="utf-8").read()
    i = s.find('<div class="toc"')
    if i < 0:
        return None
    seg = s[i:]
    end = min([x for x in (seg.find("</ol>"), seg.find("</ul>")) if x > 0] or [len(seg)])
    order, titles = [], {}
    for m in TOC_ITEM.finditer(seg[:end]):
        f, t = m.group(1), m.group(2)
        if f in order or not os.path.exists(os.path.join(d, f)):
            continue
        order.append(f)
        titles[f] = re.sub(r"^[①-⑳]\s*", "", t).split("——")[0].strip()
    return (order, titles) if order else None


def page_title(f: str) -> str:
    """取内容页 <title> 里「·」后的一段作为导航名。"""
    s = open(f, encoding="utf-8").read()
    m = re.search(r"<title>([^<]*)</title>", s)
    if not m:
        return f
    t = m.group(1)
    return t.split("·")[-1].strip() if "·" in t else t


def rebuild(d: str, order, titles, report):
    n = len(order)
    for i, f in enumerate(order):
        p = os.path.join(d, f)
        s = open(p, encoding="utf-8").read()
        m = re.search(r'(<footer class="foot">)([\s\S]*?)(</footer>)', s)
        if not m:
            report.append(f"  ✗ {d}/{f} 没有 footer")
            continue
        head, body, tail = m.group(1), m.group(2), m.group(3)
        home = os.path.relpath(os.path.join(SITE, "index.html"), d).replace(os.sep, "/")
        back = f'<a href="{home}">回到首页</a>'

        # 保留原有的批次完/批尾标记
        tailmark = ""
        mt = re.search(r'(B\d+(?:\s*\+\s*B\d+)?\s*批次完[^<]*)', body)
        if mt:
            tailmark = mt.group(1).strip()

        if i == 0:
            link = back if not tailmark else f"{back}　|　{tailmark}"
        else:
            pf = order[i - 1]
            link = (f'<a href="{pf}">上一节：{titles.get(pf) or page_title(os.path.join(d, pf))}</a>'
                    f"　|　{back}")
        if i < n - 1:
            nf = order[i + 1]
            link += f'　|　下一节：<a href="{nf}">{titles.get(nf) or page_title(os.path.join(d, nf))}</a>'
        elif tailmark:
            link += f"　|　{tailmark}"
        else:
            link += "　|　（本批完）"

        new = head + f"\n  <p style=\"margin:0\">{link}</p>\n" + tail
        if new != s:
            open(p, "w", encoding="utf-8").write(s[: m.start()] + new + s[m.end():])
            report.append(f"  ↻ {d}/{f} 链已重建")


def main() -> int:
    report = []
    for d in sorted(glob.glob(os.path.join(SITE, "*"))):
        if not os.path.isdir(d) or os.path.basename(d) == "assets":
            continue
        rel = os.path.basename(d)
        if rel == "pillar":
            continue  # 支柱页用「下一站」，语义不同，不动
        r = toc_order(d)
        if not r:
            report.append(f"  – {rel}/ 无 TOC 顺序，跳过")
            continue
        order, titles = r
        report.append(f"  {rel}/  顺序: {' → '.join(order)}")
        rebuild(d, order, titles, report)
    print("\n".join(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
