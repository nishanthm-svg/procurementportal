"""Members Dividend & Bonus workbook -> data/portal.json (git-ignored; holds member data).

Usage: python -I build_data.py "<Members Dividend & Bonus details - 12 years.xlsx>"
Sheet1, header on row 2: dividend FY14-15..FY25-26, bonus FY15-16..FY25-26.
"""
import json, re, sys
from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
OUT = HERE / 'data' / 'portal.json'

YEARS = ['14-15', '15-16', '16-17', '17-18', '18-19', '19-20', '20-21', '21-22', '22-23', '23-24', '24-25', '25-26']
DIV = YEARS                          # dividend columns
BON = [y + '.1' for y in YEARS[1:]]  # bonus columns (pandas suffixes the repeated year headers)

# Spelling variants -> one ACO name (same list as the MPP Performance Portal)
ALIASES = {'P JYOTHISWAR REDDY': 'P JYOTHEESWAR REDDY', 'Y V NARAYAN REDDY': 'YV NARAYAN REDDY'}


def name(v):
    s = re.sub(r'\s+', ' ', str(v or '').strip().upper())
    return ALIASES.get(s, s)


def text(v):
    return re.sub(r'\s+', ' ', str(v if pd.notna(v) else '').strip())


def money(v):
    f = round(float(v or 0), 2)
    return int(f) if f == int(f) else f


def allot(v):
    if pd.isna(v) or str(v).strip() == '':
        return ''
    if isinstance(v, str) and not re.match(r'\d{4}-\d\d-\d\d', v):
        return 'NEW' if 'new' in v.lower() else v.strip()
    return pd.to_datetime(v).strftime('%Y-%m-%d')


def main(xlsx):
    df = pd.read_excel(xlsx, header=1, dtype={c: str for c in ('Unkey', 'PLANT CODE', 'MPP CODE', 'MEMBER CODE', 'FOLIO')})
    df = df.dropna(how='all')
    df['aco'] = df['Name of the ACO'].map(name)

    acos = sorted(df['aco'].unique())
    aco_ix = {a: i for i, a in enumerate(acos)}

    # One MPP per Unkey; name / BMCU = the most common spelling among its members
    mpps, mpp_ix = [], {}
    for uk, g in df.groupby('Unkey', sort=True):
        mpp_ix[uk] = len(mpps)
        mpps.append([
            str(uk), str(g['MPP CODE'].mode()[0]).zfill(3), text(g['MPP Name'].mode()[0]),
            text(g['BMCU NAME'].mode()[0]), str(g['PLANT CODE'].mode()[0]),
        ])

    members = []
    for _, r in df.iterrows():
        members.append([
            mpp_ix[r['Unkey']], aco_ix[r['aco']], text(r['MEMBER CODE']), text(r['MEMBER NAME']), text(r['FOLIO']),
            allot(r['DATE OF FIRST ALLOTMENT']), money(r['TOTAL SHARE AMOUNT UPTO MARCH,26']),
            [money(r[c]) for c in DIV], [0] + [money(r[c]) for c in BON],
        ])

    # Sanity: totals in the sheet must match the year columns
    d_tot, b_tot = df['Total Dividend paid'].sum(), df['Total Bonus paid'].sum()
    d_sum = sum(sum(m[7]) for m in members)
    b_sum = sum(sum(m[8]) for m in members)
    assert abs(d_tot - d_sum) < 1, (d_tot, d_sum)
    assert abs(b_tot - b_sum) < 5, (b_tot, b_sum)

    notes = []
    b = df[BON].astype(float)
    if (b['15-16.1'] == b['19-20.1']).all() and b['15-16.1'].sum() > 0:
        notes.append('In the source sheet, bonus for FY 2015-16 is identical to FY 2019-20 for every member. '
                     'Please confirm the FY 2015-16 bonus figures.')

    out = {
        'meta': {
            'title': 'Members Dividend & Bonus', 'source': Path(xlsx).name,
            'years': ['FY 20' + y for y in YEARS],
            'bonusFrom': 1, 'shareAsOf': 'March 2026', 'notes': notes,
        },
        'acos': acos, 'mpps': mpps, 'members': members,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    print(f'{OUT}: {len(members)} members, {len(mpps)} MPPs, {df["BMCU NAME"].nunique()} BMCUs, {len(acos)} ACOs')
    print(f'share {df["TOTAL SHARE AMOUNT UPTO MARCH,26"].sum():,.0f} · dividend {d_tot:,.0f} · bonus {b_tot:,.2f}')
    for n in notes:
        print('NOTE:', n)


if __name__ == '__main__':
    main(sys.argv[1])
