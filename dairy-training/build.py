"""Build dist/index.html (lessons + audio manifest injected) and web/ images; print the Artifact `files` map.
Usage: python build.py
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
L = json.load(open("lessons.json", encoding="utf-8"))
man = json.load(open("audio/manifest.json", encoding="utf-8")) if os.path.exists("audio/manifest.json") else {}
# keep only clips for text that still exists
from tts import LANGS, SAY
live = set()
for i, lang in enumerate(LANGS):
    for l in L:
        live |= {f"{lang}|{c[1+i]}" for c in l["cards"]}
        for q in l["quiz"]:
            live.add(f"{lang}|{q[lang]}"); live |= {f"{lang}|{o[i]}" for o in q["opts"]}
live |= {f"{lang}|{t}" for lang in LANGS for t in SAY[lang]}
man = {k: v for k, v in man.items() if k in live}

html = open("index.html", encoding="utf-8").read()
html = html.replace("/*LESSONS*/[]", json.dumps(L, ensure_ascii=False)).replace("/*AUDIO*/{}", json.dumps(man, ensure_ascii=False))
os.makedirs("dist", exist_ok=True)
open("dist/index.html", "w", encoding="utf-8").write(html)

used = {c[0] for l in L for c in l["cards"]} | {l["img"] for l in L} | {q["img"] for l in L for q in l["quiz"] if q.get("img")}
missing = sorted(u for u in used if not os.path.exists(f"images/{u}.jpg"))
os.makedirs("web", exist_ok=True)
for u in used - set(missing):
    src, dst = f"images/{u}.jpg", f"web/{u}.jpg"
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = Image.open(src).convert("RGB"); im.thumbnail((880, 880)); im.save(dst, quality=78, optimize=True, progressive=True)

files = {f"images/{u}.jpg": f"web/{u}.jpg" for u in sorted(used - set(missing))}
files.update({f"brand/{n}-web.png": f"brand/{n}-web.png" for n in ("shreeja", "nddb", "nds")})
# clips bundled per lesson+language as scripts calling window.__clipData(path, base64);
# used when the viewer blocks fetching media directly
import base64
os.makedirs("audiojs", exist_ok=True)
bundle_of, groups = {}, {}
for i, lang in enumerate(LANGS):
    for l in L:
        texts = [c[1+i] for c in l["cards"]] + [x for q in l["quiz"] for x in [q[lang]] + [o[i] for o in q["opts"]]]
        for t in texts:
            v = man.get(f"{lang}|{t}")
            if v and v not in bundle_of:
                name = f"audiojs/L{l['id']:02d}-{lang}.js"; bundle_of[v] = name; groups.setdefault(name, []).append(v)
for v in sorted(set(man.values()) - set(bundle_of)):
    name = f"audiojs/common-{os.path.basename(v)[:2]}.js"; bundle_of[v] = name; groups.setdefault(name, []).append(v)
for name, vs in groups.items():
    with open(name, "w") as fh:
        for v in vs:
            fh.write('window.__clipData&&window.__clipData("%s","%s");\n' % (v, base64.b64encode(open(v, "rb").read()).decode()))
    files[name] = name
html = open("dist/index.html", encoding="utf-8").read().replace("/*BUNDLE*/{}", json.dumps(bundle_of))
open("dist/index.html", "w", encoding="utf-8").write(html)
json.dump(files, open("dist/files.json", "w"), indent=0)
cards = sum(len(l["cards"]) for l in L)
print(f"lessons={len(L)} cards={cards} images={len(used)-len(missing)} audio_clips={len(man)} missing_images={missing}")
print("per lesson:", [len(l["cards"]) for l in L])
print("clips per language:", {lang: sum(k.startswith(lang + "|") for k in man) for lang in LANGS}, "bundles:", len(groups))
