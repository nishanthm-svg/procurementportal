# Paadi Paatashaala: working notes

Live page: https://claude.ai/artifact/BPP2bNeb5atmoExjG5rhag (private until it is shared from the page's Share menu)
Source PDF: NDDB Small Holder Dairy Farm Management Guideline (`Downloads\Dairy Farm Management Guideline.pdf`).

## Files
- `lessons.json`: all lesson text, cards and quizzes. Text columns are in the order te, en, ta, kn, hi
  (cards are `[img, te, en, ta, kn, hi]`; `t` and quiz `opts` follow the same order; quiz questions are keyed by language).
- `i18n/{ta,kn,hi}.json`: the Tamil, Kannada and Hindi translations. `python merge_i18n.py` copies them into `lessons.json`.
- `brand/`: Shreeja, NDDB and NDDB Dairy Services logos. The `*-web.png` copies are the ones the page uses.
- `index.html`: page template. `build.py` injects `lessons.json` and the audio manifest into `dist/index.html`.
- `images/`: full-size Gemini images (64). `web/`: the 880 px versions that get published as `images/*`.
- `tts.py`: records narration with Sarvam AI Bulbul v3 (female voice "kavya", pace 0.9) into `audio/*.mp3` plus `audio/manifest.json`.
  The key is read from the `SARVAM_API_KEY` environment variable or from `.sarvam_key` (git-ignored).
  `python tts.py --sample` records 3 clips to audition the voice.
- `save_images.py`: decodes Gemini images grabbed from the browser (see below).

## Status (2026-10-03)
- v4 is published: 14 lessons, 64 picture cards (3–7 per lesson), and 356 recorded Sarvam clips (voice Kavya, pace 0.9, Telugu and English).
  The page plays the recorded clips and falls back to the phone's own voice only if a clip is missing.
- A single publish takes at most 255 files, so audio goes up in batches. `dist/audio1.json` and `dist/audio2.json` are the two batches.
- If you change text in `lessons.json`, run `python tts.py` (it records only new text), then `python build.py`, and republish with the new clips.
- `voice-samples.html` plus the `dairy-training` entry in `.claude/launch.json` give a local preview at http://localhost:5310.

## Publish steps
1. Run `python build.py`. It writes `dist/index.html` and `dist/files.json`.
2. Publish with the Artifact tool:
   - `url`: the live page above
   - `file_path`: `dist/index.html`
   - `root`: this folder
   - `files`: the new or changed entries from `dist/files.json`

## Generating images in Gemini
Gemini runs in the desktop app's built-in browser pane, where the user is already signed in, with 4 tabs on `gemini.google.com/app`.
- Prompts are stored in Gemini's `localStorage`: `dS` is the style prefix and `dQ` maps image names to scenes.
- Submit: insert the text into `.ql-editor`, then press the Return key with the computer tool. Clicking Send from a script is unreliable.
- Grab: take the last `<img>` with a `blob:` src that is wider than 500 px, draw it to a canvas, and call `toDataURL`. Then run `save_images.py name1 name2 …` in tab order.
- Avoid wording like "nursing"; Gemini refuses it.

## Audio playback (v6)
The Claude desktop viewer blocked plain `<audio src>`, so the page now plays clips through Web Audio. Clip bytes come from per-lesson
bundles at `audiojs/LNN-{te,en}.js` and `audiojs/common-*.js`, which `build.py` generates. The page fetches and parses the bundle,
or loads it as a `<script>` if fetch is blocked. The `audio/*.mp3` files stay published as a last fallback.
After changing clips, republish `dist/index.html` together with the changed `audiojs/*.js` bundles.

## Landing page and languages (2026-10-05)
- The page opens on a landing screen: Shreeja logo, "Made for the dairy farmers of Shreeja", a picture collage, five language buttons,
  a Start button, and "Supported by" NDDB and NDDB Dairy Services. `#lessons` is the lesson grid; the brand name returns to the landing screen.
- The language picker in the top bar is a dropdown with తెలుగు, English, தமிழ், ಕನ್ನಡ and हिन्दी.
- Narration for all five languages uses the same voice (Kavya, pace 0.9). `python tts.py --lang ta` records one language.
- Status: v10 is published with full recorded voice in all five languages (890 clips, 178 per language).
  New bundles are larger than one 64 MB publish, so send them in two batches.
