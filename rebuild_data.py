"""
rebuild_data.py  —  Rebuild ALL exec_*.json + executives.json from Excel source.

Quota rules (enforced in the React app, not here):
  VCG = ceil(memberCount / 7) per MPP
  MRG = 1 per MPP

Data rules applied here:
  unkey     = MEMBER CODE (16-digit, unique per member)
  bmcuCode  = PLANT CODE (4-digit, zero-padded)
  mppCode   = MPP CODE (3-digit, zero-padded, e.g. "020")
  priority  = 1 if Total Days >= 200 AND Total QTY >= 500
  vcgMrg    = "VCG" | "MRG" | ""
"""

import pandas as pd
import json
import os
import math

EXCEL_PATH = r'C:\Users\nishanth.m\Downloads\New Microsoft Excel Worksheet (6).xlsx'
OUT_DIR    = r'C:\Users\nishanth.m\Desktop\Claude Experiments\Monthly report\vcg-mrg-app\data'

# ── 1. Load ──────────────────────────────────────────────────────────────────
print("Reading Excel …")
df = pd.read_excel(
    EXCEL_PATH, sheet_name='Sheet2',
    dtype={'PLANT CODE': str, 'MPP CODE': str, 'MEMBER CODE': str},
)
print(f"  {len(df):,} rows loaded")

# ── 2. Clean & normalise ─────────────────────────────────────────────────────
for col in ['Name of the Executive', 'BMCU NAME', 'MPP Name',
            'MEMBER NAME', 'Member', 'Name of the ACO']:
    df[col] = df[col].fillna('').astype(str).str.strip()

df['VCG/MRG']     = (df['VCG/MRG'].fillna('')
                                   .astype(str).str.strip()
                                   .replace({'nan': '', 'NaN': ''}))
df['PLANT CODE']  = df['PLANT CODE'].str.strip().str.zfill(4)
df['MPP CODE']    = df['MPP CODE'].str.strip().str.zfill(3)
df['MEMBER CODE'] = df['MEMBER CODE'].str.strip()
df['Total Days']  = pd.to_numeric(df['Total Days'],  errors='coerce').fillna(0).astype(int)
df['Total QTY']   = pd.to_numeric(df['Total QTY'],   errors='coerce').fillna(0.0).round(2)
df['priority']    = ((df['Total Days'] >= 200) & (df['Total QTY'] >= 500)).astype(int)

execs = sorted(df['Name of the Executive'].unique())
execs = [e for e in execs if e and e != 'nan']
print(f"  {len(execs)} executives: {execs}")

# ── 3. Build per-executive JSON ──────────────────────────────────────────────
exec_summary = {}

for exec_name in execs:
    edf = df[df['Name of the Executive'] == exec_name].copy()

    # Nested: (plantCode, bmcuName) → (mppCode, mppName) → [member dicts]
    bmcus_raw: dict = {}

    for _, row in edf.iterrows():
        plant_code  = row['PLANT CODE']
        bmcu_name   = row['BMCU NAME']
        mpp_code    = row['MPP CODE']
        mpp_name    = row['MPP Name']
        member_code = row['MEMBER CODE']

        bkey = (plant_code, bmcu_name)
        mkey = (mpp_code, mpp_name)

        bmcus_raw.setdefault(bkey, {}).setdefault(mkey, []).append({
            'unkey':      member_code,
            'memberCode': member_code,
            'memberName': row['MEMBER NAME'],
            'member':     row['Member'],
            'totalDays':  int(row['Total Days']),
            'totalQty':   float(row['Total QTY']),
            'vcgMrg':     row['VCG/MRG'],
            'priority':   int(row['priority']),
            'acoName':    row['Name of the ACO'],
            'bmcuCode':   plant_code,
            'bmcuName':   bmcu_name,
            'plantCode':  plant_code,
            'mppCode':    mpp_code,
            'mppName':    mpp_name,
        })

    # Sort BMCUs by name, MPPs by code within each BMCU
    bmcus_list = []
    mpps_flat  = []

    for (plant_code, bmcu_name) in sorted(bmcus_raw.keys(), key=lambda x: x[1]):
        mpps = bmcus_raw[(plant_code, bmcu_name)]
        bmcu_mpps = []

        for (mpp_code, mpp_name) in sorted(mpps.keys(), key=lambda x: x[0]):
            members = mpps[(mpp_code, mpp_name)]
            mpp_key = plant_code + mpp_code   # globally unique: "3603085"
            mpp_obj = {
                'mppKey':         mpp_key,        # PLANT CODE + MPP CODE (globally unique)
                'mppCode':        mpp_code,        # 3-digit zero-padded (for display)
                'mppName':        mpp_name,
                'bmcuCode':       plant_code,
                'bmcuName':       bmcu_name,
                'memberCount':    len(members),
                'priority1Count': sum(1 for m in members if m['priority'] == 1),
                'vcgMrgCount':    sum(1 for m in members if m['vcgMrg'] in ('VCG', 'MRG')),
                'members':        members,
            }
            bmcu_mpps.append(mpp_obj)
            mpps_flat.append(dict(mpp_obj))   # copy for flat array

        bmcus_list.append({
            'bmcuCode':     plant_code,
            'bmcuName':     bmcu_name,
            'totalMPPs':    len(bmcu_mpps),
            'totalMembers': sum(m['memberCount'] for m in bmcu_mpps),
            'mpps':         bmcu_mpps,
        })

    exec_data = {
        'totalMPPs':    len(mpps_flat),
        'totalMembers': sum(m['memberCount'] for m in mpps_flat),
        'bmcus':        bmcus_list,
        'mpps':         mpps_flat,
    }

    safe_name = exec_name.replace(' ', '_').replace('/', '_')
    out_path  = os.path.join(OUT_DIR, f'exec_{safe_name}.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(exec_data, f, ensure_ascii=False, separators=(',', ':'))

    print(f"  OK {exec_name:<26}  {len(bmcus_list):>2} BMCUs "
          f"{len(mpps_flat):>4} MPPs  {exec_data['totalMembers']:>6} members")

    # Summary entry (no member data — just counts)
    exec_summary[exec_name] = {
        'totalMPPs':    len(mpps_flat),
        'totalMembers': exec_data['totalMembers'],
        'bmcus': [
            {
                'bmcuCode':     b['bmcuCode'],
                'bmcuName':     b['bmcuName'],
                'totalMPPs':    b['totalMPPs'],
                'totalMembers': b['totalMembers'],
                'mpps': [
                    {
                        'mppKey':         m['mppKey'],
                        'mppCode':        m['mppCode'],
                        'mppName':        m['mppName'],
                        'memberCount':    m['memberCount'],
                        'priority1Count': m['priority1Count'],
                        'vcgMrgCount':    m['vcgMrgCount'],
                    }
                    for m in b['mpps']
                ],
            }
            for b in bmcus_list
        ],
    }

# ── 4. Write executives.json ─────────────────────────────────────────────────
epath = os.path.join(OUT_DIR, 'executives.json')
with open(epath, 'w', encoding='utf-8') as f:
    json.dump(exec_summary, f, ensure_ascii=False, separators=(',', ':'))

print(f"\nDONE: {len(exec_summary)} executives rebuilt from {len(df):,} rows")
print(f"Output: {OUT_DIR}")
