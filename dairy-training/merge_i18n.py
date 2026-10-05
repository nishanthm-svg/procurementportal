"""Merge i18n/{ta,kn,hi}.json translations into lessons.json.
Text order everywhere: te, en, ta, kn, hi (cards [img, te, en, ta, kn, hi]; t and opts likewise; quiz keys per language).
Usage: python merge_i18n.py
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
EXTRA = ["ta", "kn", "hi"]
L = json.load(open("lessons.json", encoding="utf-8"))
tr = {k: {x["id"]: x for x in json.load(open(f"i18n/{k}.json", encoding="utf-8"))} for k in EXTRA}
for l in L:
    l["t"] = l["t"][:2] + [tr[k][l["id"]]["t"] for k in EXTRA]
    for n, c in enumerate(l["cards"]):
        l["cards"][n] = c[:3] + [tr[k][l["id"]]["cards"][n] for k in EXTRA]
    for n, q in enumerate(l["quiz"]):
        for k in EXTRA:
            x = tr[k][l["id"]]["quiz"][n]
            assert len(x["opts"]) == len(q["opts"]), (k, l["id"], n)
            q[k] = x["q"]
        q["opts"] = [o[:2] + [tr[k][l["id"]]["quiz"][n]["opts"][j] for k in EXTRA] for j, o in enumerate(q["opts"])]
    for k in EXTRA:
        assert len(tr[k][l["id"]]["cards"]) == len(l["cards"]) and len(tr[k][l["id"]]["quiz"]) == len(l["quiz"]), (k, l["id"])
json.dump(L, open("lessons.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("merged", len(L), "lessons")
