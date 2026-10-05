"""Build a standalone website in site/ for GitHub Pages (run build.py first).
On a normal web host each clip is fetched as its own mp3, so the per-lesson audiojs bundles are left out.
Usage: python build_site.py
"""
import json, os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
OUT = "site"

html = open("dist/index.html", encoding="utf-8").read()
start = html.index("const BUNDLE = ") + len("const BUNDLE = ")
end = html.index(";\n", start)
html = html[:start] + "{}" + html[end:]

if os.path.isdir(OUT):
    for name in os.listdir(OUT):          # keep site/.git so the folder stays a repo
        if name != ".git":
            p = os.path.join(OUT, name)
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
os.makedirs(OUT, exist_ok=True)
open(f"{OUT}/index.html", "w", encoding="utf-8").write(html)
open(f"{OUT}/.nojekyll", "w").close()

files = json.load(open("dist/files.json"))
man = json.load(open("audio/manifest.json", encoding="utf-8"))
L = json.load(open("lessons.json", encoding="utf-8"))
copies = {k: v for k, v in files.items() if not k.startswith("audiojs/")}
copies.update({v: v for v in set(man.values())})
for dst, src in copies.items():
    os.makedirs(os.path.dirname(f"{OUT}/{dst}"), exist_ok=True)
    shutil.copy2(src, f"{OUT}/{dst}")

size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) if ".git" not in d for f in fs)
print(f"site/: {len(copies) + 2} files, {size / 1e6:.1f} MB")
