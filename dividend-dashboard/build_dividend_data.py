"""
Build public/dividend.json.gz from the Members Dividend workbook.

Usage:  python build_dividend_data.py "C:/path/to/Members Dividend.xlsx"

Output is compact and grouped by village (MPP) so the API can aggregate fast:
  { years: [...], mpps: [{ k, aco, bmcu, plant, code, name, m: [[name, code, folio, allot, share, y0..y11], ...] }] }
"""
import gzip, json, sys
from pathlib import Path
import pandas as pd

SRC = sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / 'Downloads' / 'Members Dividend.xlsx')
OUT = Path(__file__).parent / 'public' / 'dividend.json.gz'
YEARS = ['14-15', '15-16', '16-17', '17-18', '18-19', '19-20', '20-21', '21-22', '22-23', '23-24', '24-25', '25-26']

df = pd.read_excel(SRC, dtype={'Unkey': str, 'PLANT CODE': str, 'MPP CODE': str, 'MEMBER CODE': str, 'FOLIO': str})
df['ACO'] = df['Name of the ACO'].astype(str).str.strip().str.upper()
df['BMCU'] = df['BMCU NAME'].astype(str).str.strip().str.upper()
df['MPPN'] = df['MPP Name'].astype(str).str.strip().str.upper()
for y in YEARS + ['TOTAL SHARE AMOUNT UPTO MARCH,26']:
    df[y] = pd.to_numeric(df[y], errors='coerce').fillna(0).round().astype(int)

def allot(v):
    if isinstance(v, str):
        return 'NEW' if 'new' in v.lower() else v[:10]
    try:
        return pd.Timestamp(v).strftime('%Y-%m-%d')
    except Exception:
        return ''

df['ALLOT'] = df['DATE OF FIRST ALLOTMENT'].map(allot)

mpps, seen = [], {}
for (aco, bmcu, unkey), g in df.groupby(['ACO', 'BMCU', 'Unkey'], sort=True):
    members = [
        [r['MEMBER NAME'].strip(), r['MEMBER CODE'], r['FOLIO'], r['ALLOT'], int(r['TOTAL SHARE AMOUNT UPTO MARCH,26'])]
        + [int(r[y]) for y in YEARS]
        for _, r in g.iterrows()
    ]
    k = f'{unkey}-{g["PLANT CODE"].iloc[0]}'
    seen[k] = seen.get(k, 0) + 1
    if seen[k] > 1:
        k += f'-{seen[k]}'
    mpps.append({
        'k': k,
        'aco': aco,
        'bmcu': bmcu,
        'plant': g['PLANT CODE'].iloc[0],
        'code': unkey,
        'name': g['MPPN'].mode().iloc[0],
        'm': members,
    })

payload = {'years': YEARS, 'mpps': mpps}
OUT.parent.mkdir(parents=True, exist_ok=True)
with gzip.open(OUT, 'wt', encoding='utf-8') as f:
    json.dump(payload, f, separators=(',', ':'), ensure_ascii=False)

total_div = int(df[YEARS].to_numpy().sum())
print(f'{len(df)} members, {len(mpps)} villages, dividend Rs {total_div:,} -> {OUT} ({OUT.stat().st_size/1e6:.1f} MB)')
