"""Usage: python save.py name1 [name2 ...]
Decodes data:image URLs (in order) from the newest browser tool-result file into dairy-training/images/<name>.jpg.
Also writes a contact sheet of the saved images to scratchpad/sheet.jpg for review."""
import sys, glob, os, json, base64, re
from PIL import Image
RES = r"C:\Users\nishanth.m\.claude\projects\C--Users-nishanth-m-Desktop-Claude-Experiments-Monthly-report--claude-worktrees-dairy-farm-management-2ea688\c58f9851-89fe-46ab-bde0-94e0946a41fe\tool-results"
OUT = r"C:\Users\nishanth.m\Desktop\Claude Experiments\Monthly report\.claude\worktrees\dairy-farm-management-2ea688\dairy-training\images"
SHEET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sheet.jpg")
os.makedirs(OUT, exist_ok=True)
f = max(glob.glob(os.path.join(RES, "mcp-Claude_Browser-*.txt")), key=os.path.getmtime)
txt = open(f, encoding="utf-8").read()
segs = [s for s in re.split(r"\[javascript_tool:javascript_exec\]", txt) if "data:image" in s or "NOIMG" in s] or [txt]
names = sys.argv[1:]
saved = []
datas = []
for name, seg in zip(names, segs):
    m = re.search(r"data:image/\w+;base64,([A-Za-z0-9+/=]{1000,})", seg)
    if not m:
        print("MISSING", name, ":", re.search(r"NOIMG[^\"]{0,160}", seg).group(0) if "NOIMG" in seg else "?")
        continue
    d = m.group(1); datas.append(d)
    fn = name if name.endswith(".jpg") else name + ".jpg"
    open(os.path.join(OUT, fn), "wb").write(base64.b64decode(d))
    saved.append(fn)
print(f"found {len(datas)} images for {len(names)} names; saved:", saved)
os.remove(f)
if saved:
    n = len(saved); cols = 2 if n > 1 else 1; rows = (n + cols - 1) // cols
    s = Image.new("RGB", (512 * cols, 384 * rows), "white")
    for k, fn in enumerate(saved):
        s.paste(Image.open(os.path.join(OUT, fn)).convert("RGB").resize((512, 384)), ((k % cols) * 512, (k // cols) * 384))
    s.save(SHEET, quality=80)
