#!/usr/bin/env python3
"""站点进度统计：按批次 / 支柱 / 领域汇总。

⚠️ 批次匹配必须用 `batch.split()[0]` 取编号，不能用 startswith。
   否则 "B12".startswith("B1") 为真，会把 B12 错算进 B1。
"""
import json, os, collections, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = json.load(open(os.path.join(ROOT, "data", "matrix.json"), encoding="utf-8"))


def bno(r):
    """取批次编号：B1 / B12 —— 必须按空格切，不能用 startswith。"""
    return r["batch"].split()[0]


def bname(r):
    return r["batch"]


# ---- 自检：所有批次编号都应形如 B<数字> ----
bad = [r["batch"] for r in M if not r["batch"].split()[0][1:].isdigit()]
if bad:
    print("✗ 批次编号异常:", set(bad))
    sys.exit(1)

nums = sorted({bno(r) for r in M}, key=lambda x: int(x[1:]))
names = {bno(r): bname(r) for r in M}

print("=" * 62)
print("站点进度总览")
print("=" * 62)

total = len(M)
done = sum(1 for r in M if r["status"].startswith("已建"))
print(f"  总单元 {total}　已建 {done}　待建 {total - done}　覆盖率 {done/total*100:.0f}%\n")

print(f"{'批次':<24}{'完成':>10}")
print("-" * 62)
for n in nums:
    g = [r for r in M if bno(r) == n]
    d = sum(1 for r in g if r["status"].startswith("已建"))
    flag = "✅" if d == len(g) else ("⬜" if d == 0 else "🟡")
    print(f"  {names[n]:<22}{flag} {d:>2}/{len(g):<3} ({d/len(g)*100:3.0f}%)")
print(f"  {'合计':<22}   {done:>2}/{total:<3} ({done/total*100:3.0f}%)")

# ---- 按支柱 ----
print("\n" + "=" * 62)
print("按支柱")
print("=" * 62)
pc = collections.Counter(r["pillar"] for r in M)
pd_ = collections.Counter(r["pillar"] for r in M if r["status"].startswith("已建"))
for p in ["数", "量", "形", "关系", "规则", "结构"]:
    if pc.get(p):
        print(f"  {p:<4} {pd_.get(p,0):>3}/{pc[p]:<3} ({pd_.get(p,0)/pc[p]*100:3.0f}%)")

# ---- 几何线 ----
geo = [r for r in M if bno(r) in ("B6", "B7", "B8")]
gd = sum(1 for r in geo if r["status"].startswith("已建"))
if geo:
    print(f"\n  几何线 (B6+B7+B8): {gd}/{len(geo)} = {gd/len(geo)*100:.0f}%")

# ---- 完整性 ----
print("\n" + "=" * 62)
uniq = {(r["book"], r["unit"]) for r in M}
print(f"唯一 (册,单元) 组合: {len(uniq)}　应为 95　{'✅' if len(uniq)==95 else '✗'}")
dup = [k for k, c in collections.Counter((r["book"], r["unit"]) for r in M).items() if c > 1]
print(f"重复项: {len(dup)}　{'✅' if not dup else dup[:5]}")
