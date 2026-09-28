#!/usr/bin/env python3
"""
normalize_quiz.py —— 题库 HTML 规范化器

解决的问题：题库 JS 里写 HTML（如 <em class="hl">…</em>）时，
属性引号会和 JS 字符串的双引号冲突，导致整个 script 块语法错误，
练习区静默不渲染。

规则：
  1. 题库字符串内部的 HTML 属性一律改用【单引号】
     （单引号在双引号 JS 字符串里是合法字符，不会截断）
  2. 修复被误删的 key 冒号：  stem "x"  ->  stem: "x"
  3. 修复被误删的 key 冒号：  why"<str  ->  why:"<str
  4. 修复题库里未转义的【裸换行】（最隐蔽的一种：JS 双引号字符串不能跨行）
用法：python3 _tools/normalize_quiz.py site/xxx.html [更多文件...]
"""
import re
import sys
import os

KEYS = r'stem|why|miss|kidSay|answer|opts|title'


def normalize_block(js: str) -> str:
    # 1) HTML 属性：双引号 -> 单引号（仅限 <tag ...> 形式）
    js = re.sub(r'(<(?:span|em|b|i|strong|code)\b[^<>]*?)\sclass="([^"]*)"',
                 r"\1 class='\2'", js)
    # 2) 修复 key 缺失的冒号
    #    stem "..."   -> stem: "..."
    js = re.sub(r'\b(' + KEYS + r')(\s+)(?=[\"\[])(?!:)', r'\1:\2', js)
    #    why"<strong>  -> why:"<strong>
    js = re.sub(r'\b(' + KEYS + r')(?=")', r'\1:', js)
    # 3) 修复裸换行：双引号字符串不能跨行。把 "xxx<换行>yyy" 合并成一行
    #    只在题库对象字面量范围内做，且跳过真正的结构换行（行尾是 , { } ;）
    def _join(m):
        return '"' + m.group(1) + ' '
    # 逐行处理：若一行引号数为奇数，说明字符串未闭合，下一行是它的延续
    lines = js.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        L = lines[i]
        # 统计不在转义中的双引号
        nq = len(re.findall(r'(?<!\\)"', L))
        if nq % 2 == 1:
            # 与下一行合并
            j = i + 1
            buf = L
            while j < len(lines) and nq % 2 == 1:
                nxt = lines[j].strip()
                buf = buf.rstrip() + ' ' + nxt
                nq += len(re.findall(r'(?<!\\)"', nxt))
                j += 1
            merged.append(buf)
            i = j
            continue
        merged.append(L)
        i += 1
    return '\n'.join(merged)


def fix_file(path: str) -> bool:
    s = open(path, encoding="utf-8").read()
    # 只处理题库 script 块（后面跟 <script src 的那个）
    m = re.search(r'(<script>[\s\S]*?</script>\s*<script src)', s)
    if not m:
        return False
    blk = m.group(1)
    new = normalize_block(blk)
    if new == blk:
        return False
    open(path, "w", encoding="utf-8").write(s.replace(blk, new))
    return True


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    n = 0
    for p in sys.argv[1:]:
        if fix_file(p):
            print(f"  ✦ 已规范: {p}")
            n += 1
    print(f"共规范 {n} 个文件" if n else "  无需改动")


if __name__ == "__main__":
    main()
