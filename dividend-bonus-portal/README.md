# Members Dividend & Bonus portal

Field portal for the "Members Dividend & Bonus details - 12 years" workbook: share capital
invested vs dividend (FY 2014-15 to 2025-26) and bonus (FY 2015-16 to 2025-26), for every
member, MPP, BMCU and ACO.

- **Show:** Dividend + Bonus, Dividend only, or Bonus only, for any year range (From / To,
  or quick picks: all 12 years, last 5, last 3, latest year).
- **Tabs:** Overview (KPIs, per ₹100 invested, year chart, investment-vs-received chart,
  year table), Year-wise matrix (ACO / BMCU / MPP × year), Compare (ranked tables + chart),
  MPP & presentation, Members (search + year-by-year statement), Admin (ACO logins, full export).
- **Presentation:** every MPP (and any ACO / BMCU / all view) has a slide deck: cover,
  year-wise, investment paid back, top 10 members, all members. Print / Save PDF gives A4 landscape.
- **Landing page:** public front page with Gemini-generated photos (`assets/landing/`, HF cows),
  company-wide totals (members, share capital, dividend, bonus, year-wise bars) and a Sign in button.
  Only these aggregate totals are unencrypted; member data stays behind the login.
- **Logins:** ADMIN sees everything; ACO01–ACO34 each see only their own MPPs and members.

Each login's slice is gzipped and encrypted separately (AES-256-GCM, PBKDF2-SHA256 250k) into
`dist/d/<LOGIN>.bin`; the browser downloads only its own file after sign-in and decrypts it locally.

## Refresh

Node is at `C:/Users/nishanth.m/tools/node-v20.19.1-win-x64/node.exe`.

```
python -I build_data.py "<Members Dividend & Bonus details - 12 years.xlsx>"   # -> data/portal.json
node build.js                                                                  # -> dist/index.html, dist/d/*.bin, dist/credentials.csv
python -I make_credentials_xlsx.py                                             # -> dist/Dividend_Bonus_Portal_Logins.xlsx
```

Publish: copy `dist/index.html` and `dist/d/` to `shreeja-lms/dividend-bonus/`, commit, push.
Live: https://nishanthm-svg.github.io/shreeja-lms/dividend-bonus/

Logins and passwords live in the git-ignored `.credentials.json` and are reused at every
rebuild; new ACOs get new IDs automatically. To reset one password, delete that entry and
rebuild. `data/`, `dist/` and `.credentials.json` never go to git.

ACO names are upper-cased and trimmed (the sheet has "T Eswaraiah" and "T ESWARAIAH" etc.).
