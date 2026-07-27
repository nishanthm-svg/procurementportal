#!/usr/bin/env python3
"""
Builds the static JSON dataset the incentive-portal app ships with, from the
producer incentive Excel export plus the existing procurement portal's BMCU
list (for the BMCU -> ACO/AO join).

Usage:
    python scripts/build_data.py [path-to-excel] [path-to-procurement-json]

Defaults point at the file used to build this app the first time; pass your
own paths when refreshing with a new month's export.
"""
import json
import sys
import datetime
from pathlib import Path
from collections import defaultdict

import openpyxl

SCRIPT_DIR = Path(__file__).resolve().parent
APP_DIR = SCRIPT_DIR.parent
REPO_ROOT = APP_DIR.parent
OUT_DIR = APP_DIR / "src" / "data"

DEFAULT_EXCEL = Path.home() / "Downloads" / "Shreeja MMPCL FY-2025-26-Producer Incentive release Final (1).xlsx"
DEFAULT_PROCUREMENT_JSON = REPO_ROOT / "backend" / "data" / "procurement.json"


def load_aco_map(procurement_json_path):
    """plant_code (int) -> ao name, from the existing procurement portal data."""
    if not procurement_json_path.exists():
        print(f"WARNING: {procurement_json_path} not found, ACO will be 'Unassigned' for all BMCUs")
        return {}
    data = json.loads(procurement_json_path.read_text(encoding="utf-8"))
    aco_map = {}
    for b in data.get("bmcu", []):
        code = b.get("plant_code")
        if code is None:
            continue
        try:
            aco_map[int(code)] = b.get("ao") or "Unassigned"
        except (TypeError, ValueError):
            continue  # skip non-numeric rows like "Grand Total"
    return aco_map


def num(v):
    if v is None:
        return 0.0
    return round(float(v), 2)


def main():
    excel_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_EXCEL
    procurement_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_PROCUREMENT_JSON

    if not excel_path.exists():
        print(f"ERROR: Excel file not found at {excel_path}")
        sys.exit(1)

    print(f"Reading {excel_path} ...")
    aco_map = load_aco_map(procurement_path)

    wb = openpyxl.load_workbook(excel_path, data_only=True, read_only=True)
    ws = wb["Sheet1"]

    # bmcu_code -> info
    bmcus = {}
    # (bmcu_code, mpp_code) -> info
    mpps = {}
    # (bmcu_code, mpp_code) -> list of member dicts
    members_by_mpp = defaultdict(list)

    row_count = 0
    unmatched_bmcu_codes = set()

    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[5] is None:
            continue
        row_count += 1

        bmcu_code = str(row[5]).strip()
        bmcu_name = (row[6] or "").strip()
        mpp_code = str(row[7]).strip()
        mpp_name = (row[8] or "").strip()
        member_code = str(row[9]).strip() if row[9] is not None else ""
        member_name = (row[10] or "").strip()
        qty = num(row[16])
        bonus = num(row[17])
        medical = num(row[18])
        total = num(row[19]) if row[19] is not None else round(bonus + medical, 2)
        status = row[14] or ""

        try:
            aco = aco_map.get(int(bmcu_code), "Unassigned")
        except ValueError:
            aco = "Unassigned"
        if aco == "Unassigned":
            unmatched_bmcu_codes.add(bmcu_code)

        if bmcu_code not in bmcus:
            bmcus[bmcu_code] = {
                "code": bmcu_code, "name": bmcu_name, "aco": aco,
                "mpp_codes": set(), "member_count": 0,
                "total_qty": 0.0, "total_bonus": 0.0, "total_medical": 0.0, "total_amount": 0.0,
            }
        b = bmcus[bmcu_code]
        b["mpp_codes"].add(mpp_code)
        b["member_count"] += 1
        b["total_qty"] += qty
        b["total_bonus"] += bonus
        b["total_medical"] += medical
        b["total_amount"] += total

        mkey = (bmcu_code, mpp_code)
        if mkey not in mpps:
            mpps[mkey] = {
                "bmcu_code": bmcu_code, "bmcu_name": bmcu_name, "aco": aco,
                "code": mpp_code, "name": mpp_name, "member_count": 0,
                "total_qty": 0.0, "total_bonus": 0.0, "total_medical": 0.0, "total_amount": 0.0,
            }
        m = mpps[mkey]
        m["member_count"] += 1
        m["total_qty"] += qty
        m["total_bonus"] += bonus
        m["total_medical"] += medical
        m["total_amount"] += total

        members_by_mpp[mkey].append({
            "code": member_code, "name": member_name,
            "qty": qty, "bonus": bonus, "medical": medical, "total": total,
            "status": status,
        })

    print(f"Processed {row_count} member rows across {len(bmcus)} BMCUs, {len(mpps)} MPPs")
    if unmatched_bmcu_codes:
        print(f"NOTE: {len(unmatched_bmcu_codes)} BMCU code(s) had no ACO match in procurement.json: "
              f"{sorted(unmatched_bmcu_codes)[:20]}{' ...' if len(unmatched_bmcu_codes) > 20 else ''}")

    # ---- finalize + write ----
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "mpps").mkdir(exist_ok=True)
    (OUT_DIR / "members").mkdir(exist_ok=True)

    bmcu_list = []
    for code, b in bmcus.items():
        bmcu_list.append({
            "code": b["code"], "name": b["name"], "aco": b["aco"],
            "mpp_count": len(b["mpp_codes"]), "member_count": b["member_count"],
            "total_qty": round(b["total_qty"], 2), "total_bonus": round(b["total_bonus"], 2),
            "total_medical": round(b["total_medical"], 2), "total_amount": round(b["total_amount"], 2),
        })
    bmcu_list.sort(key=lambda x: -x["total_bonus"])
    (OUT_DIR / "bmcus.json").write_text(json.dumps(bmcu_list, ensure_ascii=False), encoding="utf-8")

    # mpps grouped per bmcu file, sorted by bonus desc
    mpps_per_bmcu = defaultdict(list)
    for (bmcu_code, mpp_code), m in mpps.items():
        mpps_per_bmcu[bmcu_code].append({
            "code": m["code"], "name": m["name"], "member_count": m["member_count"],
            "total_qty": round(m["total_qty"], 2), "total_bonus": round(m["total_bonus"], 2),
            "total_medical": round(m["total_medical"], 2), "total_amount": round(m["total_amount"], 2),
        })
    for bmcu_code, mlist in mpps_per_bmcu.items():
        mlist.sort(key=lambda x: -x["total_bonus"])
        (OUT_DIR / "mpps" / f"{bmcu_code}.json").write_text(json.dumps(mlist, ensure_ascii=False), encoding="utf-8")

    # members per (bmcu, mpp) file, sorted by bonus desc
    for (bmcu_code, mpp_code), mlist in members_by_mpp.items():
        mlist.sort(key=lambda x: -x["bonus"])
        (OUT_DIR / "members" / f"{bmcu_code}_{mpp_code}.json").write_text(
            json.dumps(mlist, ensure_ascii=False), encoding="utf-8")

    # ACO summary
    aco_agg = defaultdict(lambda: {"bmcu_codes": set(), "mpp_codes": set(), "member_count": 0,
                                    "total_qty": 0.0, "total_bonus": 0.0, "total_medical": 0.0, "total_amount": 0.0})
    for b in bmcu_list:
        a = aco_agg[b["aco"]]
        a["bmcu_codes"].add(b["code"])
        a["member_count"] += b["member_count"]
        a["total_qty"] += b["total_qty"]
        a["total_bonus"] += b["total_bonus"]
        a["total_medical"] += b["total_medical"]
        a["total_amount"] += b["total_amount"]
    for (bmcu_code, mpp_code) in mpps.keys():
        aco = bmcus[bmcu_code]["aco"]
        aco_agg[aco]["mpp_codes"].add((bmcu_code, mpp_code))

    aco_summary = []
    for aco, a in aco_agg.items():
        aco_summary.append({
            "aco": aco, "bmcu_count": len(a["bmcu_codes"]), "mpp_count": len(a["mpp_codes"]),
            "member_count": a["member_count"], "total_qty": round(a["total_qty"], 2),
            "total_bonus": round(a["total_bonus"], 2), "total_medical": round(a["total_medical"], 2),
            "total_amount": round(a["total_amount"], 2),
        })
    aco_summary.sort(key=lambda x: -x["total_bonus"])
    (OUT_DIR / "aco_summary.json").write_text(json.dumps(aco_summary, ensure_ascii=False), encoding="utf-8")

    # Leaderboard: top 5 members overall, top 5 MPPs, top 5 BMCUs (all by bonus)
    all_members_flat = []
    for (bmcu_code, mpp_code), mlist in members_by_mpp.items():
        bmcu_name = bmcus[bmcu_code]["name"]
        mpp_name = mpps[(bmcu_code, mpp_code)]["name"]
        for mem in mlist:
            all_members_flat.append({
                "member_code": mem["code"], "member_name": mem["name"],
                "bmcu_code": bmcu_code, "bmcu_name": bmcu_name,
                "mpp_code": mpp_code, "mpp_name": mpp_name,
                "bonus": mem["bonus"], "qty": mem["qty"],
            })
    all_members_flat.sort(key=lambda x: -x["bonus"])

    top_mpps = []
    for (bmcu_code, mpp_code), m in mpps.items():
        top_mpps.append({
            "bmcu_code": bmcu_code, "bmcu_name": m["bmcu_name"], "mpp_code": m["code"], "mpp_name": m["name"],
            "total_bonus": round(m["total_bonus"], 2), "total_qty": round(m["total_qty"], 2),
            "member_count": m["member_count"],
        })
    top_mpps.sort(key=lambda x: -x["total_bonus"])

    leaderboard = {
        "top_members": all_members_flat[:5],
        "top_mpps": top_mpps[:5],
        "top_bmcus": bmcu_list[:5],
    }
    (OUT_DIR / "leaderboard.json").write_text(json.dumps(leaderboard, ensure_ascii=False), encoding="utf-8")

    meta = {
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "source_file": excel_path.name,
        "total_bmcus": len(bmcu_list),
        "total_mpps": len(mpps),
        "total_members": row_count,
        "total_qty": round(sum(b["total_qty"] for b in bmcu_list), 2),
        "total_bonus": round(sum(b["total_bonus"] for b in bmcu_list), 2),
    }
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote data to {OUT_DIR}")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
