#!/usr/bin/env python3
"""站点自检：题库 JS 合法性 + 乱码 + 图示挂载 + 断链。"""
import glob, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
NODE = os.path.expanduser("~/.nvm/versions/node/v24.14.1/bin/node")
bad = 0

print("=" * 60); print("1) 题库 JS 合法性"); print("=" * 60)
for p in sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True)):
    rel = os.path.relpath(p, SITE)
    s = open(p, encoding="utf-8").read()
    m = re.search(r"<script>([\s\S]*?)</script>\s*<script src", s)
    if not m: continue
    tmp = "/tmp/_chk.js"
    open(tmp, "w", encoding="utf-8").write(m.group(1))
    r = subprocess.run([NODE, "--check", tmp], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ✗ {rel}"); print("   ", r.stderr.split("\n")[3] if len(r.stderr.split("\n"))>3 else r.stderr[:120]); bad += 1
print("  ✅ 全部合法" if bad == 0 else "")

print("\n" + "=" * 60); print("2) 乱码 / 非预期字符"); print("=" * 60)
n0 = bad
for p in sorted(glob.glob(os.path.join(SITE, "**", "*.*"), recursive=True)):
    if os.path.splitext(p)[1] not in (".html", ".js", ".css"): continue
    s = open(p, encoding="utf-8", errors="replace").read()
    for m2 in re.finditer("[�가-힯]", s):
        ln = s[:m2.start()].count("\n") + 1
        print(f"  ✗ {os.path.relpath(p, SITE)}:{ln} {m2.group(0)!r}"); bad += 1
print("  ✅ 无" if bad == n0 else "")

print("\n" + "=" * 60); print("3) 断链"); print("=" * 60)
n0 = bad
for p in sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True)):
    s = open(p, encoding="utf-8").read(); base = os.path.dirname(p)
    for m2 in re.finditer(r'(?:href|src)="([^"#][^"]*)"', s):
        u = m2.group(1)
        if u.startswith(("http", "mailto:", "data:", "//")): continue
        target = u.split("#")[0]
        if not target: continue
        # 以 / 开头的是站点根绝对路径：站点部署在域名根，/favicon.svg 就是 site/favicon.svg
        if target.startswith("/"):
            resolved = os.path.join(SITE, target.lstrip("/"))
        else:
            resolved = os.path.join(base, target)
        if not os.path.exists(os.path.normpath(resolved)):
            print(f"  ✗ {os.path.relpath(p, SITE)} -> {u}"); bad += 1
print("  ✅ 无断链" if bad == n0 else "")

print("\n" + "=" * 60); print("4) 题库字段完整性（每题必须有 answer/why/miss/kidSay）"); print("=" * 60)
n0 = bad
QSTART = re.compile(r'\{\s*stem\s*:')
# 每题必备字段：kidSay 是站点核心约定（家长可以照念的台词），缺一即不合格
NEED = ("answer", "why", "miss", "kidSay")
for p in sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True)):
    rel = os.path.relpath(p, SITE)
    s = open(p, encoding="utf-8").read()
    idxs = [m.start() for m in QSTART.finditer(s)]
    for i, st in enumerate(idxs):
        en = idxs[i + 1] if i + 1 < len(idxs) else len(s)
        blk = s[st:en]
        lost = [f for f in NEED if not re.search(rf'\b{f}\s*:', blk)]
        if lost:
            stem = re.search(r'stem\s*:\s*["\'](.*?)["\']', blk)
            txt = (stem.group(1) if stem else "?")[:40]
            print(f"  ✗ {rel} 第{i+1}题 缺 {','.join(lost)}  | {txt}")
            bad += 1
print("  ✅ 每题字段齐全" if bad == n0 else "")

print("\n" + "=" * 60); print("5) 目录死锚（TOC 的 #锚点必须有对应 id）"); print("=" * 60)
n0 = bad
for p in sorted(glob.glob(os.path.join(SITE, "**", "*.html"), recursive=True)):
    s = open(p, encoding="utf-8").read()
    toc = re.search(r'<div class="toc"[\s\S]*?</ol>', s)
    if not toc: continue
    ids = set(re.findall(r'id="([^"]+)"', s))
    for a in sorted(set(re.findall(r'href="#([^"]+)"', toc.group(0)))):
        if a not in ids:
            print(f"  ✗ {os.path.relpath(p, SITE)} 目录 #{a} 无对应 id"); bad += 1
print("  ✅ 无死锚" if bad == n0 else "")

print("\n" + "=" * 60)
print(f"结论: {'✅ 全部通过' if bad == 0 else f'✗ {bad} 处问题'}")
sys.exit(0 if bad == 0 else 1)
