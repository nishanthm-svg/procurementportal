# Members Dividend Dashboard (standalone)

Share capital invested vs cumulative dividend received (FY 2014-15 to 2025-26), per ACO → BMCU → village,
with Top 5/10/20 members, ACOs, BMCUs and villages, and a printable presentation per village.

Builds to **one self-contained HTML file** (data embedded) — open it from disk, email it, or put it on any static host.

```bash
npm install                     # once
npm run data -- "C:/Users/nishanth.m/Downloads/Members Dividend.xlsx"   # refresh data from the workbook
npm run build                   # -> dist/Members_Dividend_Dashboard.html
npm run dev                     # local development on http://localhost:5180
```
