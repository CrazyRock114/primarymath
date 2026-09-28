#!/usr/bin/env python3
"""
微信公众号「合集」(album) 全量抓取器
-----------------------------------
数据来源：
  1) 合集列表  GET https://mp.weixin.qq.com/mp/appmsgalbum?action=getalbum&album_id=...
     -> 无需鉴权，实测可直接返回全量文章 JSON（分页靠 begin_msgid/begin_itemidx）
  2) 单篇正文  GET https://mp.weixin.qq.com/s?__biz=..&mid=..&idx=..&sn=..&chksm=..
     -> 必须用微信 App 的 User-Agent，否则 302 到「未知错误」

产物：
  data/album.json              合集文章清单
  data/articles/NNN_slug.html  正文 HTML（干净版，仅 js_content）
  data/articles/NNN_slug.json  结构化正文（标题/作者/时间/段落/图片）
  data/images/NNN/xx.jpg       正文图片本地化
"""
import json, os, re, sys, time, hashlib, subprocess, datetime
from urllib.parse import quote, unquote
from lxml import html as LH

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
ART_DIR = os.path.join(DATA, "articles")
IMG_DIR = os.path.join(DATA, "images")

UA_WX = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
         "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003128) "
         "NetType/WIFI Language/zh_CN")
UA_DESK = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
           "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36")

BIZ = "MzU0NjAxOTQ2Mw=="          # 合集所属公众号 biz
ALBUM_ID = "4402543889857855491"   # 合集 id

for d in (ART_DIR, IMG_DIR):
    os.makedirs(d, exist_ok=True)


def curl(url, ua=UA_WX, out=None, timeout=30):
    cmd = ["curl", "-sL", "--compressed", "--max-time", str(timeout), "-A", ua, url]
    if out:
        cmd += ["-o", out]
    p = subprocess.run(cmd, capture_output=True)
    return p.stdout if not out else p.returncode


# ---------------------------------------------------------------- 合集枚举
def fetch_album(biz=BIZ, album_id=ALBUM_ID, page_size=20, delay=0.7, verbose=True):
    """分页枚举合集全部文章。continue_flag 可能是 int 0 也可能是 str '0'，都要当停止条件。"""
    base = ("https://mp.weixin.qq.com/mp/appmsgalbum?action=getalbum"
            f"&__biz={quote(biz, safe='')}&album_id={album_id}&subscene=1&f=json")
    out, bm, bi, page = [], None, None, 0
    seen = set()
    meta_info = {}
    while True:
        page += 1
        url = base + (f"&begin_msgid={bm}&begin_itemidx={bi}&count={page_size}" if bm else "")
        raw = curl(url)
        try:
            resp = json.loads(raw)["getalbum_resp"]
        except Exception as e:
            print(f"  !! 第{page}页解析失败: {e}; raw={raw[:120]!r}")
            break
        bi_ = resp.get("base_info") or {}
        for k, v in bi_.items():
            meta_info.setdefault(k, v)          # 首页信息优先，空壳页不覆盖
        items = resp.get("article_list") or []
        if not items:
            if verbose:
                print(f"  第{page}页: 空 -> 停止")
            break
        new = 0
        for it in items:
            sig = (it["msgid"], it["itemidx"])
            if sig in seen:
                continue
            seen.add(sig)
            out.append(it)
            new += 1
        flag = resp.get("continue_flag")
        more = str(flag) not in ("0", "False", "false", "", "None")
        if verbose:
            print(f"  第{page}页: +{new}  累计 {len(out)}  continue_flag={flag!r} -> {'继续' if more else '结束'}")
        if not more:
            break
        last = items[-1]
        bm, bi = last["msgid"], last["itemidx"]
        time.sleep(delay)
    return out, meta_info


def ts2date(ts):
    return datetime.datetime.fromtimestamp(int(ts)).strftime("%Y-%m-%d")


# ---------------------------------------------------------------- 正文抓取
BLOCK_PATTERNS = [   # 命中即判定为风控/删除页
    r"该内容已被发布者删除", r"此内容因违规无法查看", r"环境异常[，,]完成验证后即可继续访问",
    r"该公众号已迁移", r"此内容因投诉涉嫌侵权，无法查看", r"参数错误",
]


def looks_blocked(text):
    return any(re.search(p, text) for p in BLOCK_PATTERNS)


def parse_article(raw_html):
    """从 3MB+ 的微信页壳里抽出干净正文。"""
    if isinstance(raw_html, bytes):
        raw_html = raw_html.decode("utf-8", "ignore")
    doc = LH.fromstring(raw_html)

    def var(pattern, default=""):
        m = re.search(pattern, raw_html)
        return m.group(1) if m else default

    meta = {
        "title": html_unesc(var(r"var msg_title = '(.*?)'\.html", "")),
        "author": var(r'var author = "(.*?)"', "") or var(r'var nickname = "(.*?)"', ""),
        "account": html_unesc(var(r'var nickname = "(.*?)"', "")),
        "publish_ts": var(r'var ct = "(\d+)"', "") or var(r'var create_time = "(\d+)"', ""),
        "digest": html_unesc(var(r'var msg_desc = "(.*?)"', "")),
    }
    meta["publish_date"] = ts2date(meta["publish_ts"]) if meta["publish_ts"] else ""

    nodes = doc.xpath('//*[@id="js_content"]') or doc.xpath('//div[contains(@class,"rich_media_content")]')
    if not nodes:
        return meta, None, {"images": [], "video_iframes": [], "videos": [], "voices": [], "miniprograms": []}
    body = nodes[0]

    # --- 清理微信占位元素
    for bad in body.xpath('.//*[contains(@class,"js_img_loading")]|.//*[contains(@class,"rich_pages_wx_tags")]|.//script|.//style'):
        bad.getparent().remove(bad)

    # --- 去掉微信的「先隐藏、靠 JS 再显示」初始态
    # js_content 原始 style 是 visibility:hidden; opacity:0，微信客户端 JS 加载后才移除。
    # 我们剥掉了那段 JS，不清掉就整篇正文隐形（浏览器里打开是空白，但 DOM 里文字都在）。
    vis = body.get("style") or ""
    vis = re.sub(r"(visibility\s*:\s*hidden|opacity\s*:\s*0(\.0+)?)\s*;?", "", vis)
    if vis.strip():
        body.set("style", vis.strip())
    else:
        del body.attrib["style"]

    # 排版占位符（mp-style-type）本身 display:none，连带清掉以免干扰后续站点样式
    for ph in body.xpath('.//p[.//mp-style-type]'):
        ph.getparent().remove(ph)

    # --- 视频 / 音频 / 小程序
    media = {
        "video_iframes": [i.get("data-src") or i.get("src") for i in body.xpath('.//iframe[contains(@class,"video_iframe")]')],
        "videos": [v.get("data-mpvid") or v.get("data-vid") for v in body.xpath('.//*[contains(@class,"video_iframe") or contains(@class,"video_area")]') if v.get("data-mpvid") or v.get("data-vid")],
        "voices": [v.get("data-mpvid") for v in body.xpath('.//*[contains(@class,"mpvoice")]')],
        "miniprograms": [a.get("data-link") for a in body.xpath('.//*[contains(@class,"appmsg_card")]')],
    }

    # --- 图片：正文用 data-src 懒加载
    imgs, seen = [], set()
    for im in body.xpath(".//img"):
        src = im.get("data-src") or im.get("src") or ""
        if not src.startswith("http"):
            continue
        if "mmbiz.qpic.cn" not in src and "mmbiz.qlogo.cn" not in src:
            continue  # 过滤 emoji sprite 之类
        if src in seen:
            continue
        seen.add(src)
        imgs.append({
            "src": src,
            "data_type": im.get("data-type", ""),
            "data_wx_fmt": im.get("data-wxfmt", ""),
            "data_ratio": im.get("data-ratio", ""),
            "alt": im.get("alt", "") or "",
        })
        im.set("src", src)  # 便于离线渲染

    inner_html = LH.tostring(body, encoding="unicode")
    return meta, inner_html, {"images": imgs, **media}


def html_unesc(s):
    import html as _h
    s = re.sub(r"\\x([0-9a-fA-F]{2})", lambda m: chr(int(m.group(1), 16)), s or "")
    return _h.unescape(re.sub("<[^>]+>", "", s)).strip()


def clean_text(inner_html):
    doc = LH.fromstring(f"<div>{inner_html}</div>")
    for bad in doc.xpath(".//script|.//style"):
        bad.getparent().remove(bad)
    txt = " ".join(doc.itertext())
    return re.sub(r"[ \t\u3000]+", " ", re.sub(r"\n{3,}", "\n\n", txt)).strip()


def slug(title, idx):
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "-", title).strip("-")[:40]
    return f"{idx:02d}_{s}"


def download_image(url, dest_dir, name_hint=""):
    os.makedirs(dest_dir, exist_ok=True)
    ext = ".jpg"
    m = re.search(r"/(\d+)$", url.split("?")[0])
    if "/mmbiz_png/" in url: ext = ".png"
    elif "/mmbiz_gif/" in url: ext = ".gif"
    elif "/mmbiz_jpg/" in url or "/mmbiz_qpic" in url: ext = ".jpg"
    h = hashlib.sha1(url.encode()).hexdigest()[:10]
    fn = f"{h}{ext}"
    path = os.path.join(dest_dir, fn)
    # CDN 返回的真实格式常与 URL 路径不符（mmbiz_png 路径下也可能是 JPEG），
    # 按文件魔数纠正扩展名，避免后续构建站点时 MIME 判断出错
    if os.path.exists(path) and os.path.getsize(path) > 1024:
        return _fix_ext(path)
    curl(url, UA_WX, out=path, timeout=40)
    if os.path.exists(path) and os.path.getsize(path) < 200:
        os.remove(path)
        return None
    return _fix_ext(path) if os.path.exists(path) else None


def _fix_ext(path):
    """按魔数纠正扩展名（mmbiz CDN 的 .png/.jpg 路径与实际编码不保证一致）。"""
    try:
        with open(path, "rb") as f:
            head = f.read(12)
    except OSError:
        return path
    real = None
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        real = ".png"
    elif head.startswith(b"\xff\xd8\xff"):
        real = ".jpg"
    elif head.startswith(b"GIF8"):
        real = ".gif"
    elif head[:4] in (b"RIFF",) and head[8:12] == b"WEBP":
        real = ".webp"
    elif head.startswith(b"BM"):
        real = ".bmp"
    if not real:
        return path
    stem, cur = os.path.splitext(path)
    if cur.lower() == real:
        return path
    newp = stem + real
    if os.path.exists(newp):
        return newp
    os.rename(path, newp)
    return newp


def localize_html(html_path, images):
    """把正文 HTML 里的远程 mmbiz 图换成 data/images 下的本地相对路径。

    必须用 DOM 改，不能用 str.replace()：lxml 序列化会把 URL 里的 & 转义成
    &amp;，原样匹配会静默失败（不报错，图还是远程的，离线打开就裂图）。
    """
    tree = LH.parse(html_path)
    by_src = {im["src"]: im for im in images if im.get("local")}
    n = 0
    for im_node in tree.xpath('//div[@class="wx-content"]//img'):
        cur = im_node.get("src") or ""
        if cur.startswith("http") and cur in by_src:
            im_node.set("src", "../" + by_src[cur]["local"].replace("data/", ""))
            n += 1
    tree.write(html_path, encoding="utf-8", method="html")
    return n


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    print("=" * 68)
    print("STEP 1  枚举合集文章清单")
    print("=" * 68)
    items, album_info = fetch_album()
    json.dump(album_info, open(os.path.join(DATA, "album_meta.json"), "w"), ensure_ascii=False, indent=1)
    print(f"专栏: {album_info.get('nickname','?')}  阅读量 {album_info.get('read_count','?')}  简介: {(album_info.get('description') or '')[:60]}...")
    for i, a in enumerate(items, 1):
        a["index"] = i
        a["date"] = ts2date(a["create_time"])
    json.dump(items, open(os.path.join(DATA, "album.json"), "w"), ensure_ascii=False, indent=1)
    print(f"\n→ 共 {len(items)} 篇，已存 data/album.json\n")

    if limit:
        items = items[:limit]

    print("=" * 68)
    print("STEP 2  抓取正文")
    print("=" * 68)
    ok = blocked = 0
    stats = []
    for a in items:
        url = a["url"].replace("http://", "https://")
        raw = curl(url, UA_WX, timeout=30)
        text_probe = raw[:200000].decode("utf-8", "ignore")
        if looks_blocked(text_probe) or len(raw) < 20000:
            print(f"  ✗ [{a['index']:02d}] {a['title'][:24]}  被拦截/空 ({len(raw)}B)")
            blocked += 1
            a["fetch"] = "blocked"
            continue
        meta, inner, extra = parse_article(raw)
        if not inner:
            print(f"  ✗ [{a['index']:02d}] {a['title'][:24]}  正文节点缺失(已删除/不可用)")
            a["fetch"] = "no_content"; blocked += 1
            continue
        sl = slug(a["title"], a["index"])
        if not meta.get("account"):
            meta["account"] = album_info.get("nickname", "")
        # 干净正文 HTML
        page = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>{meta['title'] or a['title']}</title></head>
<body>
<article class="wx-article" data-biz="{BIZ}" data-mid="{a['msgid']}" data-idx="{a['itemidx']}">
<h1 class="wx-title">{meta['title'] or a['title']}</h1>
<p class="wx-meta">{meta.get('account','')} · {a['date']}</p>
<div class="wx-content">{inner}</div>
</article></body></html>"""
        open(os.path.join(ART_DIR, sl + ".html"), "w", encoding="utf-8").write(page)
        content_text = clean_text(inner)
        json.dump({**meta, "index": a["index"], "date": a["date"], "slug": sl,
                   "source_url": url, "text": content_text,
                   "text_len": len(content_text), **extra},
                  open(os.path.join(ART_DIR, sl + ".json"), "w"), ensure_ascii=False, indent=1)
        a["slug"] = sl
        a["fetch"] = "ok"
        a["text_len"] = len(content_text)
        a["img_count"] = len(extra["images"])
        ok += 1
        stats.append((a["index"], a["date"], a["title"], len(content_text), len(extra["images"]),
                      len(extra["videos"]), len(extra["voices"])))
        print(f"  ✓ [{a['index']:02d}] {a['title'][:26]:<28} 正文{len(content_text):>6}字 图{len(extra['images']):>2} 视频{len(extra['videos'])} 音频{len(extra['voices'])}")
        time.sleep(1.0)

    json.dump(items, open(os.path.join(DATA, "album.json"), "w"), ensure_ascii=False, indent=1)
    print(f"\n成功 {ok} / 失败 {blocked} / 合计 {len(items)}")

    if os.environ.get("SKIP_IMG"):
        print("\n(SKIP_IMG=1 跳过图片下载)"); return

    print("\n" + "=" * 68)
    print("STEP 3  下载图片")
    print("=" * 68)
    img_ok = img_fail = 0
    for a in items:
        if a.get("fetch") != "ok" or not a.get("slug"):
            continue
        jf = os.path.join(ART_DIR, a["slug"] + ".json")
        d = json.load(open(jf))
        dest = os.path.join(IMG_DIR, a["slug"])
        local = []
        for im in d["images"]:
            pth = download_image(im["src"], dest)
            if pth:
                local.append(os.path.relpath(pth, ROOT))
                im["local"] = os.path.relpath(pth, ROOT)
                img_ok += 1
            else:
                im["local"] = None
                img_fail += 1
        d["images"] = d["images"]
        json.dump(d, open(jf, "w"), ensure_ascii=False, indent=1)
        # 把 HTML 里的远程图替换为本地相对路径
        # 注意：不能用字符串 replace —— lxml 序列化时 & 会被转义成 &amp;，
        # 导致 im['src'] 原样匹配不上（实测 58 张图里大量静默失败）。必须走 DOM。
        hf = os.path.join(ART_DIR, a["slug"] + ".html")
        localize_html(hf, d["images"])
        print(f"  [{a['index']:02d}] {a['title'][:24]:<26} {len(local)}/{len(d['images'])} 张")
    print(f"\n图片: 成功 {img_ok} / 失败 {img_fail}")

    print("\n" + "=" * 68)
    print("STEP 4  汇总统计")
    print("=" * 68)
    tot_img = sum(s[4] for s in stats)
    print(f"总正文长度: {sum(s[3] for s in stats):,} 字")
    print(f"总图片数:   {tot_img} 张")
    print(f"含视频文章: {sum(1 for s in stats if s[5])}   含音频文章: {sum(1 for s in stats if s[6])}")
    if stats:
        print(f"单篇平均:   {sum(s[3] for s in stats)//len(stats)} 字, {tot_img/len(stats):.1f} 图")


if __name__ == "__main__":
    main()
