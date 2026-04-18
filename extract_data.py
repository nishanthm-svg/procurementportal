import pandas as pd
import json, math, numpy as np
from datetime import datetime, date

EXCEL_PATH = "C:\\Users\\nishanth.m\\Downloads\\Procurement Performacne report Mar\u202626.xlsx".replace("\u2026", "'")
# Use direct string
EXCEL_PATH = r"C:\Users\nishanth.m\Downloads\Procurement Performacne report Mar'26.xlsx"

def cv(v):
    if v is None: return None
    if isinstance(v, (datetime, date)): return str(v)
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)): return None
    if isinstance(v, (np.integer,)): return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return round(f, 4) if not (math.isnan(f) or math.isinf(f)) else None
    if isinstance(v, float): return round(v, 4) if not (math.isnan(v) or math.isinf(v)) else None
    return v

def s(v): return str(v).strip() if not pd.isna(v) else None

xl = pd.ExcelFile(EXCEL_PATH)
data = {}

# ─── CLUSTER ────────────────────────────────────────────────────
df = pd.read_excel(xl, 'Cluster', header=None)
rows = []
for _, r in df.iloc[4:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'cluster_manager': s(r[0]),
        'cow_qty': cv(r[1]), 'cow_lpd': cv(r[2]), 'cow_fat': cv(r[3]),
        'cow_snf': cv(r[4]), 'cow_ts': cv(r[5]), 'cow_fat_kgs': cv(r[6]),
        'cow_snf_kgs': cv(r[7]), 'cow_amount': cv(r[8]), 'cow_rate': cv(r[9]),
        'cow_ts_rate': cv(r[10]),
        'buf_qty': cv(r[11]), 'buf_lpd': cv(r[12]), 'buf_fat': cv(r[13]),
        'buf_snf': cv(r[14]), 'buf_ts': cv(r[15]), 'buf_fat_kgs': cv(r[16]),
        'buf_snf_kgs': cv(r[17]), 'buf_amount': cv(r[18]),
    })
data['cluster'] = rows

# ─── AO ─────────────────────────────────────────────────────────
df = pd.read_excel(xl, 'AO', header=None)
rows = []
for _, r in df.iloc[4:].iterrows():
    if pd.isna(r[0]): continue
    def g(i): return cv(r[i]) if len(r) > i else None
    rows.append({
        'ao': s(r[0]), 'cluster_manager': s(r[1]),
        # Cow milk
        'cow_qty': g(2), 'cow_lpd': g(3), 'cow_fat': g(4),
        'cow_snf': g(5), 'cow_ts': g(6), 'cow_fat_kgs': g(7),
        'cow_snf_kgs': g(8), 'cow_amount': g(9),
        'cow_rate': g(10), 'cow_ts_rate': g(11),
        # Buffalo milk
        'buf_qty': g(12), 'buf_lpd': g(13), 'buf_fat': g(14),
        'buf_snf': g(15), 'buf_ts': g(16), 'buf_fat_kgs': g(17),
        'buf_snf_kgs': g(18), 'buf_amount': g(19), 'buf_rate': g(20),
        'kg_fat_rate': g(21),
        # Budget & Achievement
        'bud_lpd': g(22), 'bud_qty': g(23), 'bud_lpd2': g(24),
        'ach_pct': g(25), 'bud_fat': g(26), 'bud_snf': g(27), 'bud_ts': g(28),
        'bud_fat_kgs': g(29), 'bud_snf_kgs': g(30), 'bud_amount': g(31),
        # Feed Analysis
        'bud_feed_mt': g(32), 'feed_kgs': g(33), 'act_feed_mt': g(34),
        'feed_ach_pct': g(35), 'feed_per_ltr': g(36),
        # Members
        'mm': g(37), 'reg_members': g(38), 'pouring_members': g(39),
        'pouring_pct': g(40), 'feed_used_members': g(41),
        'feed_used_members_pct': g(42),
        # MPP stats
        'total_mpps': g(43), 'feed_used_mpps': g(44), 'feed_used_mpps_pct': g(45),
        # Transport & Logistics
        'bud_tp_cost': g(46), 'bud_tp_amount': g(47),
        'act_kms_day': g(48), 'act_tp_amount_day': g(49), 'act_tp_cost': g(50),
        # Health & Inputs
        'bud_health_camps': g(51), 'health_camps': g(52),
        'inputs_value_members': g(53), 'inputs_value_lakhs': g(54),
        # GPRS
        'total_shifts': g(55), 'gprs_shifts': g(56), 'gprs_pct': g(57),
        # Commission
        'actual_commission': g(58), 'commission_deductions': g(59),
        'net_commission': g(60), 'commission_pct': g(61),
        # Per-unit metrics
        'per_ltr_ts': g(62), 'qty_per_km': g(63),
        'qty_per_member': g(64), 'qty_per_mpp': g(65),
        # Cost breakdown
        'op_cost_income': g(66), 'sahayak_commission': g(67),
        'tp_cost_rs': g(68), 'chilling_cost': g(69), 'profit_loss': g(70),
        'op_cost_income2': g(71), 'sahayak_commission2': g(72),
        'tp_cost2': g(73), 'chilling_cost2': g(74),
        'total_expenses': g(75), 'profit_loss2': g(76),
    })
data['ao'] = rows

# ─── BMCU ────────────────────────────────────────────────────────
df = pd.read_excel(xl, 'BMCU', header=None)
rows = []
for _, r in df.iloc[3:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_code': cv(r[0]), 'plant_name': s(r[1]),
        'ao': s(r[2]), 'cluster_manager': s(r[3]), 'type': s(r[4]),
        'cow_qty': cv(r[5]), 'cow_lpd': cv(r[6]), 'cow_fat': cv(r[7]),
        'cow_snf': cv(r[8]), 'cow_ts': cv(r[9]), 'cow_fat_kgs': cv(r[10]),
        'cow_snf_kgs': cv(r[11]), 'cow_amount': cv(r[12]),
        'cow_rate': cv(r[13]), 'cow_ts_rate': cv(r[14]),
        'buf_qty': cv(r[15]), 'buf_lpd': cv(r[16]),
    })
data['bmcu'] = rows

# ─── MPP ─────────────────────────────────────────────────────────
df = pd.read_excel(xl, 'MPP', header=None)
rows = []
for _, r in df.iloc[2:].iterrows():
    if pd.isna(r[0]) or pd.isna(r[1]): continue
    def gm(i): return cv(r[i]) if len(r) > i else None
    rows.append({
        'plant_code': gm(0), 'plant_name': s(r[1]),
        'ao': s(r[6]), 'cluster_manager': s(r[7]),
        'fa': s(r[8]), 'mpp': s(r[9]), 'mpp_name': s(r[10]),
        'qty': gm(11), 'lpd': gm(12),
        'fat': gm(13), 'snf': gm(14),
        'ts': gm(15), 'fat_kgs': gm(16), 'snf_kgs': gm(17),
        'amount': gm(18), 'rate': gm(19),
        'pouring_members': gm(20),
        # Extended columns
        'ts2': gm(35), 'fat_kgs2': gm(36), 'snf_kgs2': gm(37),
        'amount2': gm(38), 'rate2': gm(39),
        'feed': gm(40), 'feed_per_ltr': gm(41), 'mm': gm(42),
        'feed_used_members': gm(43), 'reg_members': gm(44),
        'pouring_members2': gm(45), 'pouring_pct': gm(46),
        'inputs_value_members': gm(47), 'health_camps': gm(48),
        'inputs_value_lakhs': gm(50),
        'actual_commission': gm(51), 'commission_deductions': gm(52),
        'net_commission': gm(53), 'commission_pct': gm(54),
        'per_ltr_ts': gm(55), 'total_shifts': gm(56),
        'gprs_shifts': gm(57), 'gprs_pct': gm(58),
    })
data['mpp'] = rows

# ─── BUDGET ──────────────────────────────────────────────────────
df = pd.read_excel(xl, 'Bud 25-26', header=None)
months = ['Apr25','May25','Jun25','Jul25','Aug25','Sep25','Oct25','Nov25','Dec25','Jan26','Feb26','Mar26']
rows = []
for _, r in df.iloc[3:].iterrows():
    if pd.isna(r[0]): continue
    entry = {'plant_code': cv(r[0]), 'plant_name': s(r[1]), 'ao': s(r[2]), 'cluster_manager': s(r[3])}
    for i, m in enumerate(months):
        entry[m] = cv(r[4+i]) if (4+i) < len(r) else None
    rows.append(entry)
data['budget'] = rows

# ─── BMCU LFL ─────────────────────────────────────────────────────
df = pd.read_excel(xl, 'BMCU_LFL', header=None)
rows = []
for _, r in df.iloc[4:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_code': cv(r[0]), 'plant_name': s(r[1]),
        'ao': s(r[2]), 'cluster': s(r[3]),
        'lpd_prev': cv(r[4]), 'lpd_curr': cv(r[5]),
        'diff': cv(r[6]), 'growth_pct': cv(r[7]),
    })
data['bmcu_lfl'] = rows

# ─── FEED LFL ─────────────────────────────────────────────────────
df = pd.read_excel(xl, 'Feed-LFL', header=None)
rows = []
for _, r in df.iloc[3:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_code': cv(r[0]), 'plant_name': s(r[1]),
        'ao': s(r[2]), 'cluster': s(r[3]),
        'feed_prev': cv(r[4]), 'feed_curr': cv(r[5]),
        'diff': cv(r[6]),
    })
data['feed_lfl'] = rows

# ─── GPRS AO ──────────────────────────────────────────────────────
df = pd.read_excel(xl, 'GPRS-AO1', header=None)
rows = []
for _, r in df.iloc[3:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'ao': s(r[0]), 'cluster_manager': s(r[1]),
        'total_shifts': cv(r[2]), 'gprs_shifts': cv(r[3]), 'gprs_pct': cv(r[4]),
    })
data['gprs_ao'] = rows

# ─── GPRS BMCU ────────────────────────────────────────────────────
df = pd.read_excel(xl, 'BMCU-GPRS', header=None)
rows = []
for _, r in df.iloc[3:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_code': cv(r[0]), 'plant_name': s(r[1]),
        'ao': s(r[2]), 'cluster_manager': s(r[3]),
        'total_shifts': cv(r[4]), 'gprs_shifts': cv(r[5]), 'gprs_pct': cv(r[6]),
    })
data['gprs_bmcu'] = rows

# ─── <30 LPD ──────────────────────────────────────────────────────
df = pd.read_excel(xl, '<30LPD', header=None)
rows = []
for _, r in df.iloc[3:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_code': cv(r[0]), 'plant_name': s(r[1]),
        'ao': s(r[2]), 'cluster_manager': s(r[3]),
        'fa': s(r[4]), 'mpp': s(r[5]), 'mpp_name': s(r[6]), 'lpd': cv(r[7]),
    })
data['low_lpd'] = rows

# ─── SINGLE POURER ────────────────────────────────────────────────
df = pd.read_excel(xl, 'Single Pourer', header=None)
rows = []
for _, r in df.iloc[2:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_code': cv(r[0]), 'plant_name': s(r[1]),
        'ao': s(r[2]), 'cluster_manager': s(r[3]),
        'fa': s(r[4]), 'mpp': s(r[5]), 'mpp_name': s(r[6]),
        'lpd': cv(r[7]), 'feed': cv(r[8]), 'pouring_members': cv(r[9]),
        'total_shifts': cv(r[10]), 'gprs_shifts': cv(r[11]),
    })
data['single_pourer'] = rows

# ─── <12 TS MPP ───────────────────────────────────────────────────
try:
    df = pd.read_excel(xl, "<12 TS MPP's", header=None)
    rows = []
    for _, r in df.iterrows():
        if pd.isna(r[0]): continue
        rows.append({
            'plant_code': cv(r[0]), 'plant_name': s(r[1]) if len(r)>1 else None,
            'ao': s(r[2]) if len(r)>2 else None, 'cluster_manager': s(r[3]) if len(r)>3 else None,
            'mpp_name': s(r[4]) if len(r)>4 else None, 'ts': cv(r[5]) if len(r)>5 else None,
        })
    data['low_ts_mpp'] = rows
except: data['low_ts_mpp'] = []

# ─── CLOSED MPPs ──────────────────────────────────────────────────
try:
    df = pd.read_excel(xl, "Closed MPP's", header=None)
    rows = []
    for _, r in df.iterrows():
        if pd.isna(r[0]): continue
        rows.append([cv(v) if not isinstance(v, str) else v for v in r[:8]])
    data['closed_mpp'] = rows
except: data['closed_mpp'] = []

# ─── MBRT BMCU ────────────────────────────────────────────────────
try:
    df = pd.read_excel(xl, 'MBRT-BMCU', header=None)
    rows = []
    for _, r in df.iloc[2:].iterrows():
        if pd.isna(r[0]): continue
        rows.append({'plant_code': cv(r[0]), 'plant_name': s(r[1]) if len(r)>1 else None,
                     'ao': s(r[2]) if len(r)>2 else None, 'cluster': s(r[3]) if len(r)>3 else None,
                     'mbrt': cv(r[4]) if len(r)>4 else None})
    data['mbrt_bmcu'] = rows
except: data['mbrt_bmcu'] = []

# ─── PENDING RECOVERIES ───────────────────────────────────────────
df = pd.read_excel(xl, 'Pending Recoveries', header=None)
rows = []
for _, r in df.iloc[2:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'vendor_code': cv(r[0]), 'plant_code': cv(r[1]), 'plant_name': s(r[2]),
        'mpp_code': s(r[3]), 'member_code': s(r[4]), 'member_name': s(r[5]),
        'ao': s(r[6]), 'amount': cv(r[7]), 'status': s(r[8]),
    })
data['recoveries'] = rows

# ─── MANPOWER COSTS ───────────────────────────────────────────────
df = pd.read_excel(xl, 'Man Power Costs', header=None)
rows = []
for _, r in df.iloc[2:].iterrows():
    if pd.isna(r[0]): continue
    rows.append({
        'plant_name': s(r[0]), 'plant_code': cv(r[1]), 'lpd': cv(r[2]),
        'ctc_operator': cv(r[3]), 'ctc_helper': cv(r[4]), 'ctc_tester': cv(r[5]),
        'total_ctc': cv(r[6]),
        'persons_operator': cv(r[7]), 'persons_helper': cv(r[8]),
        'persons_tester': cv(r[9]), 'total_persons': cv(r[10]),
    })
data['manpower'] = rows

# ─── CANS ACCOUNT ─────────────────────────────────────────────────
try:
    df = pd.read_excel(xl, 'Cans Account', header=None)
    rows = []
    for _, r in df.iloc[2:].iterrows():
        if pd.isna(r[0]): continue
        rows.append({'ao': s(r[0]), 'cluster': s(r[1]) if len(r)>1 else None,
                     'total_cans': cv(r[2]) if len(r)>2 else None,
                     'working': cv(r[3]) if len(r)>3 else None,
                     'damaged': cv(r[4]) if len(r)>4 else None})
    data['cans'] = rows
except: data['cans'] = []

# ─── GODOWN RENTS ─────────────────────────────────────────────────
try:
    df = pd.read_excel(xl, 'Godown Rents', header=None)
    rows = []
    for _, r in df.iloc[1:].iterrows():
        vals = [cv(v) if not isinstance(v, str) else v for v in r]
        if all(v is None for v in vals): continue
        rows.append(vals[:10])
    data['godown_rents'] = rows
except: data['godown_rents'] = []

# ─── TANKER SUMMARY ───────────────────────────────────────────────
try:
    df = pd.read_excel(xl, 'TS-Cluster', header=None)
    rows = []
    for _, r in df.iloc[2:].iterrows():
        if pd.isna(r[0]): continue
        rows.append({'cluster': s(r[0]), 'tankers': cv(r[1]) if len(r)>1 else None,
                     'routes': cv(r[2]) if len(r)>2 else None})
    data['tanker_cluster'] = rows
except: data['tanker_cluster'] = []

# ─── SUMMARY ─────────────────────────────────────────────────────
cl = pd.DataFrame(data['cluster'])
total_cow = sum(r.get('cow_qty') or 0 for r in data['cluster'])
total_buf = sum(r.get('buf_qty') or 0 for r in data['cluster'])
fat_vals = [r['cow_fat'] for r in data['cluster'] if r.get('cow_fat')]
snf_vals = [r['cow_snf'] for r in data['cluster'] if r.get('cow_snf')]
total_amount = sum(r.get('cow_amount') or 0 for r in data['cluster'])
total_lpd = sum(r.get('cow_lpd') or 0 for r in data['cluster'])
pending_amt = sum(r['amount'] for r in data['recoveries'] if r.get('amount'))

# Budget vs Actual for Mar26
bud_records = [r for r in data['budget'] if r.get('Mar26')]
bmcu_lookup = {str(r['plant_code']): r for r in data['bmcu'] if r.get('plant_code')}

budget_analysis = []
for br in bud_records:
    bm = bmcu_lookup.get(str(br['plant_code']))
    if bm and br.get('Mar26') and bm.get('cow_lpd'):
        budget_analysis.append({
            'plant_code': br['plant_code'], 'plant_name': br['plant_name'],
            'ao': br['ao'], 'cluster_manager': br['cluster_manager'],
            'budget': round(float(br['Mar26']), 2),
            'actual': round(float(bm['cow_lpd']), 2),
            'variance': round(float(bm['cow_lpd']) - float(br['Mar26']), 2),
            'variance_pct': round((float(bm['cow_lpd']) - float(br['Mar26'])) / float(br['Mar26']) * 100, 2),
        })
data['budget_vs_actual'] = budget_analysis

# Filter Grand Total out before summary calc
real_clusters = [r for r in data['cluster'] if r.get('cluster_manager') and 'grand' not in r['cluster_manager'].lower()]
total_cow = sum(r.get('cow_qty') or 0 for r in real_clusters)
total_buf = sum(r.get('buf_qty') or 0 for r in real_clusters)
fat_vals = [r['cow_fat'] for r in real_clusters if r.get('cow_fat')]
snf_vals = [r['cow_snf'] for r in real_clusters if r.get('cow_snf')]
total_amount = sum(r.get('cow_amount') or 0 for r in real_clusters)
total_lpd = sum(r.get('cow_lpd') or 0 for r in real_clusters)

data['summary'] = {
    'month': "Mar'26",
    'total_cow_qty': round(total_cow, 0),
    'total_buf_qty': round(total_buf, 0),
    'total_qty': round(total_cow + total_buf, 0),
    'total_lpd': round(total_lpd, 0),
    'avg_fat': round(sum(fat_vals)/len(fat_vals), 4) if fat_vals else 0,
    'avg_snf': round(sum(snf_vals)/len(snf_vals), 4) if snf_vals else 0,
    'total_amount_rs': round(total_amount, 0),
    'total_bmcu': len(data['bmcu']),
    'total_mpp': len(data['mpp']),
    'total_ao': len(data['ao']),
    'total_cluster': len(data['cluster']),
    'low_lpd_count': len(data['low_lpd']),
    'single_pourer_count': len(data['single_pourer']),
    'pending_recovery_amount': round(pending_amt, 0),
    'above_budget_count': len([r for r in data.get('budget_vs_actual',[]) if r['variance'] >= 0]),
    'below_budget_count': len([r for r in data.get('budget_vs_actual',[]) if r['variance'] < 0]),
}

out = r'C:\Users\nishanth.m\Desktop\Claude Experiments\Monthly report\backend\data\procurement.json'
with open(out, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Extraction complete!")
for k, v in data.items():
    if isinstance(v, list):
        print(f"  {k}: {len(v)} records")
    else:
        print(f"  {k}: {v}")
