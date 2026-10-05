"""Build single-language A4 posters (Telugu and English) from poster.html's styles and render PNG + PDF.
Usage: python make_posters.py
"""
import json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
L = json.load(open("../lessons.json", encoding="utf-8"))
head = open("poster.html", encoding="utf-8").read().split("<body>")[0]

# single-language posters have room for slightly larger text
EXTRA = """<style>
.step b{font-size:19px}
.topics li{font-size:15px;line-height:1.3;align-items:center}
.topics ol{gap:7px 18px}
.te .hero h1 small{letter-spacing:0;font-size:20px}
.step{align-content:center}
.en{--display:"Hind Guntur",sans-serif}
.en .hero h1{font-weight:700;font-size:58px;letter-spacing:0}
.en .topics h2,.en .step i{font-weight:700}
</style>
"""

S = {
 "te": dict(lang="te", cls="te", file="Shreeja-Dairy-School-poster-Telugu",
   for_="శ్రీజ పాడి రైతుల కోసం", h1="పాడి పాఠశాల", h1s="చిత్రాలతో పాడి పాఠాలు",
   tag="మీ ఫోన్‌లో చిత్రాలు చూసి, మీ భాషలో విని నేర్చుకోండి",
   tag2="పాడి పశువుల మంచి పెంపకం: చిత్రాలు, మీ భాషలో వాయిస్, చిన్న ప్రశ్నలు",
   scan="స్కాన్ చేయండి", scan2="ఫోన్ కెమెరాతో QR కోడ్ స్కాన్ చేయండి",
   steps=["QR కోడ్ స్కాన్ చేయండి లేదా లింక్ తెరవండి", "మీ భాష ఎంచుకోండి",
          "చిత్రం చూడండి, 🔊 నొక్కి వినండి", "ప్రతి పాఠం చివర చిన్న ప్రశ్నలకు జవాబు చెప్పండి"],
   topics="14 పాఠాలు", topics2="· 64 చిత్రాలు",
   free="ఉచితం · యాప్ అవసరం లేదు · ఏ స్మార్ట్‌ఫోన్‌లోనైనా పనిచేస్తుంది", sup="సహకారం",
   src="NDDB చిన్న పాడి రైతుల ఫారం నిర్వహణ మార్గదర్శి ఆధారంగా. ఇది శిక్షణ కోసం మాత్రమే; చికిత్సకు పశువైద్యుడిని సంప్రదించండి.", col=0),
 "en": dict(lang="en", cls="en", file="Shreeja-Dairy-School-poster-English",
   for_="For the dairy farmers of Shreeja", h1="Dairy School", h1s="Paadi Paatashaala",
   tag="Learn good dairy animal care on your phone",
   tag2="Pictures, a voice in your own language and simple questions",
   scan="Scan me", scan2="Scan the QR code with your phone camera",
   steps=["Scan the QR code or open the link", "Choose your language",
          "Look at the picture and press 🔊 to listen", "Answer a few quick questions at the end of each lesson"],
   topics="14 lessons", topics2="· 64 pictures",
   free="Free · No app needed · Works on any smartphone", sup="SUPPORTED BY",
   src="Based on the NDDB Small Holder Dairy Farm Management Guideline. For training only; for treatment, consult your veterinarian.", col=1),
}

def body(s):
    langs = "".join(f"<em>{x}</em>" for x in ("తెలుగు", "English", "தமிழ்", "ಕನ್ನಡ", "हिन्दी"))
    steps = "".join(
        f'<div class="step"><i>{n}</i><div><b>{t}</b>{"<div class=langs>" + langs + "</div>" if n == 2 else ""}</div></div>'
        for n, t in enumerate(s["steps"], 1))
    topics = "\n".join(f"      <li><div>{l['t'][s['col']]}</div></li>" for l in L)
    return f"""<body class="{s['cls']}">
<div class="page">
  <header class="top">
    <img src="../brand/shreeja-web.png" alt="Shreeja Mahila Milk Producer Company">
    <div class="for"><b>{s['for_']}</b></div>
  </header>
  <section class="hero">
    <h1>{s['h1']}<small>{s['h1s']}</small></h1>
    <p>{s['tag']}<span>{s['tag2']}</span></p>
  </section>
  <div class="strip">
    <img src="../web/03-colostrum.jpg" alt=""><img src="../web/05-teat-dip.jpg" alt="">
    <img src="../web/08-vaccination-camp.jpg" alt=""><img src="../web/12-green-fodder.jpg" alt="">
  </div>
  <section class="main">
    <div class="qr"><img src="qr.svg" alt="QR code"><b>{s['scan']}</b><span>{s['scan2']}</span>
      <code>nishanthm-svg.github.io<br>/dairy-training</code></div>
    <div class="steps">{steps}</div>
  </section>
  <section class="topics">
    <h2>{s['topics']} <small>{s['topics2']}</small></h2>
    <ol>
{topics}
    </ol>
  </section>
  <div class="free">{s['free']}</div>
  <footer class="foot">
    <div><div class="sup">{s['sup']}</div>
      <div class="logos"><img src="../brand/nddb-web.png" alt="National Dairy Development Board"><img src="../brand/nds-web.png" alt="NDDB Dairy Services"></div></div>
    <div class="src">{s['src']}</div>
  </footer>
</div>
</body>
</html>
"""

for s in S.values():
    h = re.sub(r'<html lang="[a-z]+">', f'<html lang="{s["lang"]}">', head).replace("</head>", EXTRA + "</head>")
    open(f"{s['file']}.html", "w", encoding="utf-8").write(h + body(s))
    url = "file:///" + os.path.join(HERE, s["file"] + ".html").replace("\\", "/")
    common = [CHROME, "--headless=new", "--disable-gpu", "--virtual-time-budget=8000", "--allow-file-access-from-files"]
    subprocess.run(common + ["--hide-scrollbars", "--force-device-scale-factor=2", "--window-size=794,1123",
                             f"--screenshot={os.path.join(HERE, s['file'] + '.png')}", url], capture_output=True)
    subprocess.run(common + ["--no-pdf-header-footer", f"--print-to-pdf={os.path.join(HERE, s['file'] + '.pdf')}", url],
                   capture_output=True)
    print(s["file"], os.path.getsize(s["file"] + ".png"), os.path.getsize(s["file"] + ".pdf"))
