"""Record every card, quiz question/option and feedback phrase with Sarvam AI (Bulbul) into audio/*.mp3.

Key: set SARVAM_API_KEY, or put the key alone in dairy-training/.sarvam_key (git-ignored).
Usage:  python tts.py            # record everything missing
        python tts.py --sample   # record 2 Telugu + 1 English clip to audition the voice
        python tts.py --lang ta  # record only one language
Options: --speaker NAME (default from SPEAKER below), --pace 0.9
Clips are named by a hash of their text, so re-running only records new or changed text.
"""
import base64, hashlib, json, os, re, sys, time
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "audio")
MANIFEST = os.path.join(OUT, "manifest.json")
SPEAKER = "kavya"          # bulbul:v3 female voice
MODEL = "bulbul:v3"
PACE = 0.9
LANGS = ["te", "en", "ta", "kn", "hi"]   # same order as the text columns in lessons.json
SAY = {"te": ["సరైన జవాబు!", "మళ్ళీ ప్రయత్నించండి", "పాఠం పూర్తయింది!"],
       "en": ["Correct!", "Try again", "Lesson complete!"],
       "ta": ["சரியான பதில்!", "மீண்டும் முயற்சி செய்யுங்கள்", "பாடம் முடிந்தது!"],
       "kn": ["ಸರಿಯಾದ ಉತ್ತರ!", "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "ಪಾಠ ಮುಗಿಯಿತು!"],
       "hi": ["सही जवाब!", "फिर से कोशिश करें", "पाठ पूरा हुआ!"]}
# words the voice should say for symbols: range "to", rupees, degrees, percent, divided by, times, equals
WORDS = {"te": ("నుండి", "రూపాయలు", "డిగ్రీలు", "శాతం", "భాగించి", "ఇంటు", "సమానం"),
         "en": ("to", "rupees", "degrees", "percent", "divided by", "times", "equals"),
         "ta": ("முதல்", "ரூபாய்", "டிகிரி", "சதவீதம்", "வகுத்தல்", "பெருக்கல்", "சமம்"),
         "kn": ("ರಿಂದ", "ರೂಪಾಯಿ", "ಡಿಗ್ರಿ", "ಶೇಕಡಾ", "ಭಾಗಿಸಿ", "ಗುಣಿಸು", "ಸಮ"),
         "hi": ("से", "रुपये", "डिग्री", "प्रतिशत", "भाग", "गुणा", "बराबर")}


def key():
    k = os.environ.get("SARVAM_API_KEY")
    p = os.path.join(HERE, ".sarvam_key")
    if not k and os.path.exists(p):
        k = open(p, encoding="utf-8").read().strip()
    if not k:
        sys.exit("No Sarvam key: set SARVAM_API_KEY or create dairy-training/.sarvam_key")
    return k


def texts():
    """(lang, text) pairs exactly as the page passes them to speak()."""
    L = json.load(open(os.path.join(HERE, "lessons.json"), encoding="utf-8"))
    out = []
    for i, lang in enumerate(LANGS):
        for l in L:
            for c in l["cards"]:
                out.append((lang, c[1 + i]))
            for q in l["quiz"]:
                out.append((lang, q[lang]))
                out += [(lang, o[i]) for o in q["opts"]]
        out += [(lang, s) for s in SAY[lang]]
    seen, uniq = set(), []
    for t in out:
        if t not in seen:
            seen.add(t); uniq.append(t)
    return uniq


def spoken(lang, t):
    """Rewrite symbols so the voice reads them naturally."""
    to, rs, deg, pc, div, tim, eq = WORDS[lang]
    t = re.sub(r"(\d)\s*[–-]\s*(\d)", r"\1 " + to + r" \2", t)
    t = re.sub(r"₹\s*([\d,]+)", lambda m: m.group(1).replace(",", "") + " " + rs, t)
    reps = [("°C", " " + deg), ("%", " " + pc), ("÷", f" {div} "), ("×", f" {tim} "), ("=", f" {eq} "),
            ("సెం.మీ.", "సెంటీమీటర్లు"), ("செ.மீ.", "சென்டிமீட்டர்"), ("ಸೆಂ.ಮೀ.", "ಸೆಂಟಿಮೀಟರ್"),
            (" cm", " centimetres"), (" kg", " kilos"), (" g ", " grams "), (" g)", " grams)"),
            ("—", ", "), ("…", "")]
    for a, b in reps:
        t = t.replace(a, b)
    if lang == "en":
        t = re.sub(r"\bAI\b", "A.I.", t)
    return re.sub(r"\s+", " ", t).strip()


def record(k, lang, t, speaker, pace):
    r = requests.post("https://api.sarvam.ai/text-to-speech", timeout=60,
                      headers={"api-subscription-key": k, "Content-Type": "application/json"},
                      json={"text": spoken(lang, t), "language_code": f"{lang}-IN",
                            "speaker": speaker, "model": MODEL, "pace": pace,
                            "speech_sample_rate": 24000, "output_audio_codec": "mp3"})
    if r.status_code != 200:
        raise RuntimeError(f"{r.status_code}: {r.text[:300]}")
    return base64.b64decode("".join(r.json()["audios"]))


def main():
    a = sys.argv[1:]
    speaker = a[a.index("--speaker") + 1] if "--speaker" in a else SPEAKER
    pace = float(a[a.index("--pace") + 1]) if "--pace" in a else PACE
    os.makedirs(OUT, exist_ok=True)
    k = key()
    items = texts()
    if "--lang" in a:
        items = [t for t in items if t[0] == a[a.index("--lang") + 1]]
    if "--sample" in a:
        items = [items[0], items[3], next(t for t in items if t[0] == "en")]
    man = json.load(open(MANIFEST, encoding="utf-8")) if os.path.exists(MANIFEST) else {}
    chars = sum(len(spoken(l, t)) for l, t in items)
    print(f"{len(items)} clips, {chars} characters, speaker={speaker}, pace={pace}")
    for n, (lang, t) in enumerate(items, 1):
        h = hashlib.sha1(f"{speaker}|{pace}|{lang}|{t}".encode()).hexdigest()[:12]
        fn = f"audio/{lang}-{h}.mp3"
        if os.path.exists(os.path.join(HERE, fn)):
            man[f"{lang}|{t}"] = fn; continue
        for attempt in range(3):
            try:
                data = record(k, lang, t, speaker, pace)   # fetch first so a failed call leaves no empty file
                open(os.path.join(HERE, fn), "wb").write(data); break
            except Exception as e:
                print("  retry", n, e)
                if "insufficient_quota" in str(e):
                    json.dump(man, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
                    sys.exit("Sarvam credits are used up; top up and run again (finished clips are kept).")
                time.sleep(2 + attempt * 3)
        else:
            print("FAILED", lang, t[:60]); continue
        man[f"{lang}|{t}"] = fn
        print(f"  {n}/{len(items)} {fn}")
    json.dump(man, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("done:", len(man), "clips in manifest")


if __name__ == "__main__":
    main()
