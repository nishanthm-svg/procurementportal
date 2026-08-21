// Turns the monthly Procurement Performance Excel workbook into the JSON shape
// backend/data/procurement.json uses. Two source templates are supported:
//   - "old": the original layout extract_data.py was written for (header=None,
//     fixed row offsets, e.g. sheets named 'Cluster', 'Bud 25-26', 'BMCU_LFL').
//   - "new": the restructured layout introduced mid-2026 (real header rows,
//     sheets renamed/split, e.g. 'Cluster', 'BMCU-LPD-LFL', 'BMCU-Feed-LFL',
//     no merged feed/GPRS/commission columns on AO/MPP rows).
// Both paths produce the SAME output field names so the frontend needs no changes.
const XLSX = require('xlsx');

// ─── value helpers (mirror cv()/s() from extract_data.py) ──────────────────
function cv(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof v === 'number') {
    if (!isFinite(v)) return null;
    return Math.round(v * 10000) / 10000;
  }
  return v;
}

function s(v) {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

function isBlank(v) {
  return v === null || v === undefined || v === '';
}

function readSheet(workbook, name) {
  const ws = workbook.Sheets[name];
  if (!ws) throw new Error(`Sheet "${name}" not found in workbook`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true });
}

function g(row, i) {
  return i < row.length ? row[i] : null;
}

function optionalSheet(workbook, name, fn) {
  try {
    if (!workbook.Sheets[name]) return [];
    return fn(readSheet(workbook, name));
  } catch (_) {
    return [];
  }
}

const BUDGET_MONTHS = [
  'Apr25', 'May25', 'Jun25', 'Jul25', 'Aug25', 'Sep25', 'Oct25', 'Nov25', 'Dec25', 'Jan26', 'Feb26', 'Mar26',
  'Apr26', 'May26', 'Jun26', 'Jul26', 'Aug26', 'Sep26', 'Oct26', 'Nov26', 'Dec26', 'Jan27', 'Feb27', 'Mar27',
];

function detectTemplate(workbook) {
  const ws = workbook.Sheets['AO'];
  if (!ws) return 'new';
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }).slice(0, 5);
  const hasHeaderText = rows.some(r => r.some(c => typeof c === 'string' && c.trim() === 'A.O.'));
  return hasHeaderText ? 'new' : 'old';
}

function buildSummaryAndBudget(data, monthKey, monthLabel) {
  const pendingAmt = data.recoveries.reduce((sum, r) => sum + (r.amount || 0), 0);

  const bmcuLookup = {};
  data.bmcu.forEach(r => { if (r.plant_code != null) bmcuLookup[String(r.plant_code)] = r; });

  const budgetAnalysis = [];
  data.budget.filter(r => r[monthKey]).forEach(br => {
    const bm = bmcuLookup[String(br.plant_code)];
    if (bm && br[monthKey] && bm.cow_lpd) {
      const budget = Math.round(Number(br[monthKey]) * 100) / 100;
      const actual = Math.round(Number(bm.cow_lpd) * 100) / 100;
      const variance = Math.round((actual - budget) * 100) / 100;
      budgetAnalysis.push({
        plant_code: br.plant_code, plant_name: br.plant_name,
        ao: br.ao, cluster_manager: br.cluster_manager,
        budget, actual, variance,
        variance_pct: budget ? Math.round((variance / budget) * 100 * 100) / 100 : null,
      });
    }
  });
  data.budget_vs_actual = budgetAnalysis;

  const realClusters = data.cluster.filter(r => r.cluster_manager && !r.cluster_manager.toLowerCase().includes('grand'));
  const totalCow = realClusters.reduce((sum, r) => sum + (r.cow_qty || 0), 0);
  const totalBuf = realClusters.reduce((sum, r) => sum + (r.buf_qty || 0), 0);
  const fatVals = realClusters.map(r => r.cow_fat).filter(v => v);
  const snfVals = realClusters.map(r => r.cow_snf).filter(v => v);
  const totalAmount = realClusters.reduce((sum, r) => sum + (r.cow_amount || 0), 0);
  const totalLpd = realClusters.reduce((sum, r) => sum + (r.cow_lpd || 0), 0);

  data.summary = {
    month: monthLabel,
    total_cow_qty: Math.round(totalCow),
    total_buf_qty: Math.round(totalBuf),
    total_qty: Math.round(totalCow + totalBuf),
    total_lpd: Math.round(totalLpd),
    avg_fat: fatVals.length ? Math.round((fatVals.reduce((a, b) => a + b, 0) / fatVals.length) * 10000) / 10000 : 0,
    avg_snf: snfVals.length ? Math.round((snfVals.reduce((a, b) => a + b, 0) / snfVals.length) * 10000) / 10000 : 0,
    total_amount_rs: Math.round(totalAmount),
    total_bmcu: data.bmcu.length,
    total_mpp: data.mpp.length,
    total_ao: data.ao.length,
    total_cluster: data.cluster.length,
    low_lpd_count: data.low_lpd.length,
    single_pourer_count: data.single_pourer.length,
    pending_recovery_amount: Math.round(pendingAmt),
    above_budget_count: budgetAnalysis.filter(r => r.variance >= 0).length,
    below_budget_count: budgetAnalysis.filter(r => r.variance < 0).length,
  };

  return bmcuLookup;
}

// ════════════════════════════════════════════════════════════════════════
// OLD TEMPLATE  (header=None, fixed row offsets — the layout extract_data.py
// was written against; sheets: Cluster, AO, BMCU, MPP, 'Bud 25-26', BMCU_LFL,
// Feed-LFL, GPRS-AO1, BMCU-GPRS, <30LPD, Single Pourer, etc.)
// ════════════════════════════════════════════════════════════════════════
function extractOldTemplate(workbook, monthKey, monthLabel) {
  const data = {};

  {
    const rows = readSheet(workbook, 'Cluster').slice(4);
    data.cluster = rows.filter(r => !isBlank(r[0])).map(r => ({
      cluster_manager: s(r[0]),
      cow_qty: cv(r[1]), cow_lpd: cv(r[2]), cow_fat: cv(r[3]),
      cow_snf: cv(r[4]), cow_ts: cv(r[5]), cow_fat_kgs: cv(r[6]),
      cow_snf_kgs: cv(r[7]), cow_amount: cv(r[8]), cow_rate: cv(r[9]),
      cow_ts_rate: cv(r[10]),
      buf_qty: cv(r[11]), buf_lpd: cv(r[12]), buf_fat: cv(r[13]),
      buf_snf: cv(r[14]), buf_ts: cv(r[15]), buf_fat_kgs: cv(r[16]),
      buf_snf_kgs: cv(r[17]), buf_amount: cv(r[18]),
    }));
  }

  {
    const rows = readSheet(workbook, 'AO').slice(4);
    data.ao = rows.filter(r => !isBlank(r[0])).map(r => ({
      ao: s(r[0]), cluster_manager: s(r[1]),
      cow_qty: cv(g(r,2)), cow_lpd: cv(g(r,3)), cow_fat: cv(g(r,4)),
      cow_snf: cv(g(r,5)), cow_ts: cv(g(r,6)), cow_fat_kgs: cv(g(r,7)),
      cow_snf_kgs: cv(g(r,8)), cow_amount: cv(g(r,9)),
      cow_rate: cv(g(r,10)), cow_ts_rate: cv(g(r,11)),
      buf_qty: cv(g(r,12)), buf_lpd: cv(g(r,13)), buf_fat: cv(g(r,14)),
      buf_snf: cv(g(r,15)), buf_ts: cv(g(r,16)), buf_fat_kgs: cv(g(r,17)),
      buf_snf_kgs: cv(g(r,18)), buf_amount: cv(g(r,19)), buf_rate: cv(g(r,20)),
      kg_fat_rate: cv(g(r,21)),
      bud_lpd: cv(g(r,22)), bud_qty: cv(g(r,23)), bud_lpd2: cv(g(r,24)),
      ach_pct: cv(g(r,25)), bud_fat: cv(g(r,26)), bud_snf: cv(g(r,27)), bud_ts: cv(g(r,28)),
      bud_fat_kgs: cv(g(r,29)), bud_snf_kgs: cv(g(r,30)), bud_amount: cv(g(r,31)),
      bud_feed_mt: cv(g(r,32)), feed_kgs: cv(g(r,33)), act_feed_mt: cv(g(r,34)),
      feed_ach_pct: cv(g(r,35)), feed_per_ltr: cv(g(r,36)),
      mm: cv(g(r,37)), reg_members: cv(g(r,38)), pouring_members: cv(g(r,39)),
      pouring_pct: cv(g(r,40)), feed_used_members: cv(g(r,41)),
      feed_used_members_pct: cv(g(r,42)),
      total_mpps: cv(g(r,43)), feed_used_mpps: cv(g(r,44)), feed_used_mpps_pct: cv(g(r,45)),
      bud_tp_cost: cv(g(r,46)), bud_tp_amount: cv(g(r,47)),
      act_kms_day: cv(g(r,48)), act_tp_amount_day: cv(g(r,49)), act_tp_cost: cv(g(r,50)),
      bud_health_camps: cv(g(r,51)), health_camps: cv(g(r,52)),
      inputs_value_members: cv(g(r,53)), inputs_value_lakhs: cv(g(r,54)),
      total_shifts: cv(g(r,55)), gprs_shifts: cv(g(r,56)), gprs_pct: cv(g(r,57)),
      actual_commission: cv(g(r,58)), commission_deductions: cv(g(r,59)),
      net_commission: cv(g(r,60)), commission_pct: cv(g(r,61)),
      per_ltr_ts: cv(g(r,62)), qty_per_km: cv(g(r,63)),
      qty_per_member: cv(g(r,64)), qty_per_mpp: cv(g(r,65)),
      op_cost_income: cv(g(r,66)), sahayak_commission: cv(g(r,67)),
      tp_cost_rs: cv(g(r,68)), chilling_cost: cv(g(r,69)), profit_loss: cv(g(r,70)),
      op_cost_income2: cv(g(r,71)), sahayak_commission2: cv(g(r,72)),
      tp_cost2: cv(g(r,73)), chilling_cost2: cv(g(r,74)),
      total_expenses: cv(g(r,75)), profit_loss2: cv(g(r,76)),
    }));
  }

  {
    const rows = readSheet(workbook, 'BMCU').slice(3);
    data.bmcu = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]), type: s(r[4]),
      cow_qty: cv(r[5]), cow_lpd: cv(r[6]), cow_fat: cv(r[7]),
      cow_snf: cv(r[8]), cow_ts: cv(r[9]), cow_fat_kgs: cv(r[10]),
      cow_snf_kgs: cv(r[11]), cow_amount: cv(r[12]),
      cow_rate: cv(r[13]), cow_ts_rate: cv(r[14]),
      buf_qty: cv(r[15]), buf_lpd: cv(r[16]),
    }));
  }

  {
    const rows = readSheet(workbook, 'MPP').slice(2);
    data.mpp = rows.filter(r => !isBlank(r[0]) && !isBlank(r[1])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(g(r,6)), cluster_manager: s(g(r,7)),
      fa: s(g(r,8)), mpp: s(g(r,9)), mpp_name: s(g(r,10)),
      qty: cv(g(r,11)), lpd: cv(g(r,12)),
      fat: cv(g(r,13)), snf: cv(g(r,14)),
      ts: cv(g(r,15)), fat_kgs: cv(g(r,16)), snf_kgs: cv(g(r,17)),
      amount: cv(g(r,18)), rate: cv(g(r,19)),
      pouring_members: cv(g(r,20)),
      ts2: cv(g(r,35)), fat_kgs2: cv(g(r,36)), snf_kgs2: cv(g(r,37)),
      amount2: cv(g(r,38)), rate2: cv(g(r,39)),
      feed: cv(g(r,40)), feed_kgs: cv(g(r,40)), feed_per_ltr: cv(g(r,41)), mm: cv(g(r,42)),
      feed_used_members: cv(g(r,43)), reg_members: cv(g(r,44)),
      pouring_members2: cv(g(r,45)), pour_members: cv(g(r,45)),
      pouring_pct: cv(g(r,46)), pour_pct: cv(g(r,46)),
      inputs_value_members: cv(g(r,47)), health_camps: cv(g(r,48)),
      inputs_value_lakhs: cv(g(r,50)),
      actual_commission: cv(g(r,51)), commission_deductions: cv(g(r,52)),
      net_commission: cv(g(r,53)), commission_pct: cv(g(r,54)),
      per_ltr_ts: cv(g(r,55)), total_shifts: cv(g(r,56)),
      gprs_shifts: cv(g(r,57)), gprs_pct: cv(g(r,58)),
    }));
  }

  {
    const rows = readSheet(workbook, 'Bud 25-26').slice(3);
    data.budget = rows.filter(r => !isBlank(r[0])).map(r => {
      const entry = { plant_code: cv(r[0]), plant_name: s(r[1]), ao: s(r[2]), cluster_manager: s(r[3]) };
      BUDGET_MONTHS.forEach((m, i) => { entry[m] = cv(g(r, 4 + i)); });
      return entry;
    });
  }

  {
    const rows = readSheet(workbook, 'BMCU_LFL').slice(4);
    data.bmcu_lfl = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster: s(r[3]),
      lpd_prev: cv(r[4]), lpd_curr: cv(r[5]),
      diff: cv(r[6]), growth_pct: cv(r[7]),
    }));
  }

  {
    const rows = readSheet(workbook, 'Feed-LFL').slice(3);
    data.feed_lfl = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster: s(r[3]),
      feed_prev: cv(r[4]), feed_curr: cv(r[5]),
      diff: cv(r[6]),
    }));
  }

  {
    const rows = readSheet(workbook, 'GPRS-AO1').slice(3);
    data.gprs_ao = rows.filter(r => !isBlank(r[0])).map(r => ({
      ao: s(r[0]), cluster_manager: s(r[1]),
      total_shifts: cv(r[2]), gprs_shifts: cv(r[3]), gprs_pct: cv(r[4]),
    }));
  }

  {
    const rows = readSheet(workbook, 'BMCU-GPRS').slice(3);
    data.gprs_bmcu = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      total_shifts: cv(r[4]), gprs_shifts: cv(r[5]), gprs_pct: cv(r[6]),
    }));
  }

  {
    const rows = readSheet(workbook, '<30LPD').slice(3);
    data.low_lpd = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      fa: s(r[4]), mpp: s(r[5]), mpp_name: s(r[6]), lpd: cv(r[7]),
    }));
  }

  {
    const rows = readSheet(workbook, 'Single Pourer').slice(2);
    data.single_pourer = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      fa: s(r[4]), mpp: s(r[5]), mpp_name: s(r[6]),
      lpd: cv(r[7]), feed: cv(r[8]), pouring_members: cv(r[9]),
      total_shifts: cv(r[10]), gprs_shifts: cv(r[11]),
    }));
  }

  data.low_ts_mpp = optionalSheet(workbook, "<12 TS MPP's", rows =>
    rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: r.length > 1 ? s(r[1]) : null,
      ao: r.length > 2 ? s(r[2]) : null, cluster_manager: r.length > 3 ? s(r[3]) : null,
      mpp_name: r.length > 4 ? s(r[4]) : null, ts: r.length > 5 ? cv(r[5]) : null,
    }))
  );

  data.closed_mpp = optionalSheet(workbook, "Closed MPP's", rows =>
    rows.filter(r => !isBlank(r[0])).map(r => r.slice(0, 8).map(v => typeof v === 'string' ? v : cv(v)))
  );

  data.mbrt_bmcu = optionalSheet(workbook, 'MBRT-BMCU', rows =>
    rows.slice(2).filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: r.length > 1 ? s(r[1]) : null,
      ao: r.length > 2 ? s(r[2]) : null, cluster: r.length > 3 ? s(r[3]) : null,
      mbrt: r.length > 4 ? cv(r[4]) : null,
    }))
  );

  {
    const rows = readSheet(workbook, 'Pending Recoveries').slice(2);
    data.recoveries = rows.filter(r => !isBlank(r[0])).map(r => ({
      vendor_code: cv(r[0]), plant_code: cv(r[1]), plant_name: s(r[2]),
      mpp_code: s(r[3]), member_code: s(r[4]), member_name: s(r[5]),
      ao: s(r[6]), amount: cv(r[7]), status: s(r[8]),
    }));
  }

  {
    const rows = readSheet(workbook, 'Man Power Costs').slice(2);
    data.manpower = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_name: s(r[0]), plant_code: cv(r[1]), lpd: cv(r[2]),
      ctc_operator: cv(r[3]), ctc_helper: cv(r[4]), ctc_tester: cv(r[5]),
      total_ctc: cv(r[6]),
      persons_operator: cv(r[7]), persons_helper: cv(r[8]),
      persons_tester: cv(r[9]), total_persons: cv(r[10]),
    }));
  }

  data.cans = optionalSheet(workbook, 'Cans Account', rows =>
    rows.slice(2).filter(r => !isBlank(r[0])).map(r => ({
      ao: s(r[0]), cluster_manager: r.length > 1 ? s(r[1]) : null,
      total_cans: r.length > 2 ? cv(r[2]) : null,
      working: r.length > 3 ? cv(r[3]) : null,
      damaged: r.length > 4 ? cv(r[4]) : null,
    }))
  );

  data.godown_rents = optionalSheet(workbook, 'Godown Rents', rows =>
    rows.slice(1)
      .map(r => r.map(v => typeof v === 'string' ? v : cv(v)))
      .filter(vals => vals.some(v => v !== null))
      .map(vals => vals.slice(0, 10))
  );

  data.tanker_cluster = optionalSheet(workbook, 'TS-Cluster', rows =>
    rows.slice(2).filter(r => !isBlank(r[0])).map(r => ({
      cluster: s(r[0]), tankers: r.length > 1 ? cv(r[1]) : null,
      routes: r.length > 2 ? cv(r[2]) : null,
    }))
  );

  buildSummaryAndBudget(data, monthKey, monthLabel);
  return data;
}

// ════════════════════════════════════════════════════════════════════════
// NEW TEMPLATE  (real header rows; sheets renamed/split — introduced mid-2026)
// ════════════════════════════════════════════════════════════════════════
function extractNewTemplate(workbook, monthKey, monthLabel) {
  const data = {};

  {
    const rows = readSheet(workbook, 'Cluster').slice(3);
    data.cluster = rows.filter(r => !isBlank(r[0])).map(r => ({
      cluster_manager: s(r[0]),
      cow_qty: cv(r[1]), cow_lpd: cv(r[2]), cow_fat: cv(r[3]),
      cow_snf: cv(r[4]), cow_ts: cv(r[5]), cow_fat_kgs: cv(r[6]),
      cow_snf_kgs: cv(r[7]), cow_amount: cv(r[8]), cow_rate: cv(r[9]),
      cow_ts_rate: cv(r[10]),
      buf_qty: cv(r[11]), buf_lpd: cv(r[12]), buf_fat: cv(r[13]),
      buf_snf: cv(r[14]), buf_ts: cv(r[15]), buf_fat_kgs: cv(r[16]),
      buf_snf_kgs: cv(r[17]), buf_amount: cv(r[18]),
    }));
  }

  {
    const rows = readSheet(workbook, 'AO').slice(2);
    data.ao = rows.filter(r => !isBlank(r[0])).map(r => ({
      ao: s(r[0]), cluster_manager: s(r[1]),
      cow_qty: cv(g(r,2)), cow_lpd: cv(g(r,3)), cow_fat: cv(g(r,4)),
      cow_snf: cv(g(r,5)), cow_ts: cv(g(r,6)), cow_fat_kgs: cv(g(r,7)),
      cow_snf_kgs: cv(g(r,8)), cow_amount: cv(g(r,9)),
      cow_rate: cv(g(r,10)), cow_ts_rate: cv(g(r,11)),
      buf_qty: cv(g(r,12)), buf_lpd: cv(g(r,13)), buf_fat: cv(g(r,14)),
      buf_snf: cv(g(r,15)), buf_ts: cv(g(r,16)), buf_fat_kgs: cv(g(r,17)),
      buf_snf_kgs: cv(g(r,18)), buf_amount: cv(g(r,19)), buf_rate: cv(g(r,20)),
      kg_fat_rate: cv(g(r,21)),
      bud_lpd: cv(g(r,22)), bud_qty: cv(g(r,23)), bud_lpd2: cv(g(r,24)),
      ach_pct: cv(g(r,25)), bud_fat: cv(g(r,26)), bud_snf: cv(g(r,27)), bud_ts: cv(g(r,28)),
      bud_fat_kgs: cv(g(r,29)), bud_snf_kgs: cv(g(r,30)), bud_amount: cv(g(r,31)),
      bud_feed_mt: cv(g(r,32)), feed_kgs: cv(g(r,33)), act_feed_mt: cv(g(r,34)),
      feed_ach_pct: cv(g(r,35)), feed_per_ltr: cv(g(r,36)),
      mm: cv(g(r,37)), reg_members: cv(g(r,38)), pouring_members: cv(g(r,39)),
      pouring_pct: cv(g(r,40)), feed_used_members: cv(g(r,41)),
      feed_used_members_pct: cv(g(r,42)),
      total_mpps: cv(g(r,43)), feed_used_mpps: cv(g(r,44)), feed_used_mpps_pct: cv(g(r,45)),
      bud_tp_cost: cv(g(r,46)), bud_tp_amount: cv(g(r,47)),
      act_kms_day: cv(g(r,48)), act_tp_amount_day: cv(g(r,49)), act_tp_cost: cv(g(r,50)),
      bud_health_camps: cv(g(r,51)), health_camps: cv(g(r,52)),
      inputs_value_members: cv(g(r,53)), inputs_value_lakhs: cv(g(r,54)),
      mpp_score_card: cv(g(r,55)),
      total_shifts: cv(g(r,56)), gprs_shifts: cv(g(r,57)), gprs_pct: cv(g(r,58)),
      actual_commission: cv(g(r,59)), commission_deductions: null,
      net_commission: cv(g(r,60)), commission_pct: cv(g(r,61)),
      per_ltr_ts: cv(g(r,62)), qty_per_km: cv(g(r,63)),
      qty_per_member: cv(g(r,64)), qty_per_mpp: cv(g(r,65)),
      op_cost_income: cv(g(r,66)), sahayak_commission: cv(g(r,67)),
      tp_cost_rs: cv(g(r,68)), chilling_cost: cv(g(r,69)), profit_loss: cv(g(r,70)),
      op_cost_income2: cv(g(r,71)), sahayak_commission2: cv(g(r,72)),
      tp_cost2: cv(g(r,73)), chilling_cost2: cv(g(r,74)),
      total_expenses: cv(g(r,75)), profit_loss2: cv(g(r,76)),
    }));
  }

  {
    const rows = readSheet(workbook, 'BMCU').slice(2);
    data.bmcu = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]), type: s(r[4]),
      cow_qty: cv(r[5]), cow_lpd: cv(r[6]), cow_fat: cv(r[7]),
      cow_snf: cv(r[8]), cow_ts: cv(r[9]), cow_fat_kgs: cv(r[10]),
      cow_snf_kgs: cv(r[11]), cow_amount: cv(r[12]),
      cow_rate: cv(r[13]), cow_ts_rate: cv(r[14]),
      buf_qty: cv(r[15]), buf_lpd: cv(r[16]),
    }));
  }

  {
    // New MPP sheet splits milk into cow (11-20), buffalo (21-30) and total
    // (31-39) blocks. qty/lpd/fat/... below use the TOTAL block so a rare
    // buffalo-pouring MPP is represented correctly (equals cow-only otherwise).
    const rows = readSheet(workbook, 'MPP').slice(1);
    data.mpp = rows.filter(r => !isBlank(r[0]) && !isBlank(r[1])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(g(r,6)), cluster_manager: s(g(r,7)),
      fa: s(g(r,8)), mpp: s(g(r,9)), mpp_name: s(g(r,10)),
      qty: cv(g(r,31)), lpd: cv(g(r,32)),
      fat: cv(g(r,33)), snf: cv(g(r,34)),
      ts: cv(g(r,35)), fat_kgs: cv(g(r,36)), snf_kgs: cv(g(r,37)),
      amount: cv(g(r,38)), rate: cv(g(r,39)),
      feed: cv(g(r,40)), feed_kgs: cv(g(r,40)), feed_per_ltr: cv(g(r,41)), mm: cv(g(r,42)),
      feed_used_members: cv(g(r,43)), reg_members: cv(g(r,44)),
      pouring_members: cv(g(r,45)), pouring_members2: cv(g(r,45)), pour_members: cv(g(r,45)),
      pouring_pct: cv(g(r,46)), pour_pct: cv(g(r,46)),
      inputs_value_members: cv(g(r,47)), health_camps: cv(g(r,48)),
      inputs_value_lakhs: cv(g(r,50)),
      mpp_score_card: cv(g(r,51)),
      total_shifts: cv(g(r,52)), gprs_shifts: cv(g(r,53)), gprs_pct: cv(g(r,54)),
      actual_commission: cv(g(r,55)), commission_deductions: null,
      net_commission: cv(g(r,56)), commission_pct: cv(g(r,57)),
      per_ltr_ts: cv(g(r,58)),
    }));
  }

  // Budget sheet: name/year varies (e.g. "Bud 25-26", "Bud 26-27-Q-1") and may
  // be absent entirely some months — detect it by prefix and parse best-effort.
  data.budget = [];
  {
    const budgetSheetName = workbook.SheetNames.find(n => /^bud/i.test(n));
    if (budgetSheetName) {
      try {
        const rows = readSheet(workbook, budgetSheetName);
        const headerIdx = rows.findIndex(r => r.some(c => typeof c === 'string' && /plant|a\.o\.|cluster/i.test(c)));
        if (headerIdx >= 0) {
          const header = rows[headerIdx];
          const monthCols = [];
          header.forEach((h, i) => {
            if (i < 4 || typeof h !== 'string') return;
            const key = h.replace(/'/g, '').trim();
            if (BUDGET_MONTHS.includes(key)) monthCols.push([key, i]);
          });
          data.budget = rows.slice(headerIdx + 1).filter(r => !isBlank(r[0])).map(r => {
            const entry = { plant_code: cv(r[0]), plant_name: s(r[1]), ao: s(r[2]), cluster_manager: s(r[3]) };
            monthCols.forEach(([key, i]) => { entry[key] = cv(g(r, i)); });
            return entry;
          });
        }
      } catch (_) { data.budget = []; }
    }
  }

  data.bmcu_lfl = optionalSheet(workbook, 'BMCU-LPD-LFL', rows =>
    rows.slice(1).filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster: s(r[3]),
      lpd_prev: cv(r[4]), lpd_curr: cv(r[5]),
      diff: cv(r[6]), growth_pct: cv(r[7]),
    }))
  );

  data.feed_lfl = optionalSheet(workbook, 'BMCU-Feed-LFL', rows =>
    rows.slice(2).filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster: s(r[3]),
      feed_prev: cv(r[4]), feed_curr: cv(r[5]),
      diff: cv(r[6]),
    }))
  );

  {
    const rows = readSheet(workbook, 'GPRS-AO1').slice(1);
    data.gprs_ao = rows.filter(r => !isBlank(r[0])).map(r => ({
      ao: s(r[0]), cluster_manager: s(r[1]),
      total_shifts: cv(r[2]), gprs_shifts: cv(r[3]), gprs_pct: cv(r[4]),
    }));
  }

  {
    const rows = readSheet(workbook, 'BMCU-GPRS').slice(1);
    data.gprs_bmcu = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      total_shifts: cv(r[4]), gprs_shifts: cv(r[5]), gprs_pct: cv(r[6]),
    }));
  }

  {
    const rows = readSheet(workbook, '<30LPD').slice(1);
    data.low_lpd = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      fa: s(r[4]), mpp: s(r[5]), mpp_name: s(r[6]), lpd: cv(r[7]),
      pouring_members: r.length > 8 ? cv(r[8]) : null,
    }));
  }

  {
    const rows = readSheet(workbook, 'Single Pourer').slice(1);
    data.single_pourer = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      fa: s(r[4]), mpp: s(r[5]), mpp_name: s(r[6]),
      lpd: cv(r[7]), feed: null, pouring_members: cv(r[9]),
      total_shifts: cv(r[11]), gprs_shifts: cv(r[12]),
    }));
  }

  data.low_ts_mpp = optionalSheet(workbook, "<12 TS MPP's", rows =>
    rows.slice(1).filter(r => !isBlank(r[0])).map(r => ({
      plant_code: cv(r[0]), plant_name: s(r[1]),
      ao: s(r[2]), cluster_manager: s(r[3]),
      fa: s(r[4]), mpp: s(r[5]), mpp_name: s(r[6]),
      ts: cv(r[10]),
    }))
  );

  data.closed_mpp = optionalSheet(workbook, "Closed MPP's", rows =>
    rows.slice(1).filter(r => !isBlank(r[0])).map(r => r.slice(0, 8).map(v => typeof v === 'string' ? v : cv(v)))
  );

  // ao/cluster_manager backfilled below via bmcuLookup — MBRT-BMCU no longer carries them.
  data.mbrt_bmcu = optionalSheet(workbook, 'MBRT-BMCU', rows =>
    rows.slice(2).filter(r => !isBlank(r[1])).map(r => ({
      plant_code: cv(r[1]), plant_name: r.length > 2 ? s(r[2]) : null,
      ao: null, cluster: null,
      mbrt: r.length > 3 ? cv(r[3]) : null,
    }))
  );

  data.recoveries = optionalSheet(workbook, 'Pending Recoveries', rows =>
    rows.slice(2).filter(r => !isBlank(r[0])).map(r => ({
      vendor_code: cv(r[0]), plant_code: cv(r[1]), plant_name: s(r[2]),
      mpp_code: s(r[3]), member_code: s(r[4]), member_name: s(r[5]),
      ao: s(r[6]), amount: cv(r[7]), status: s(r[8]),
    }))
  );

  {
    const rows = readSheet(workbook, 'Man Power Costs').slice(3);
    data.manpower = rows.filter(r => !isBlank(r[0])).map(r => ({
      plant_name: s(r[0]), plant_code: cv(r[1]), handled_qty: cv(r[2]), lpd: cv(r[3]),
      ctc_operator: cv(r[4]), ctc_helper: cv(r[5]), ctc_tester: cv(r[6]),
      persons_operator: cv(r[7]), persons_helper: cv(r[8]), persons_tester: cv(r[9]),
      total_ctc: cv(r[10]), total_persons: cv(r[11]), cost_per_ltr: cv(r[12]),
    }));
  }

  // ao/cluster_manager backfilled below via bmcuLookup — new sheet is per-plant, per-can-type.
  data.cans = optionalSheet(workbook, 'Cans Account', rows => {
    const codeRow = rows[1] || [];
    const labelRow = rows[2] || [];
    const productCols = [];
    for (let i = 4; i < codeRow.length; i++) {
      if (codeRow[i] == null) continue;
      productCols.push([String(labelRow[i] || codeRow[i]).trim(), i]);
    }
    return rows.slice(3).filter(r => !isBlank(r[0])).map(r => {
      const rec = { plant_code: cv(r[0]), plant_name: s(r[1]), ao: null, cluster_manager: null };
      let total = 0;
      productCols.forEach(([label, i]) => {
        const v = cv(r[i]) || 0;
        rec[label] = v;
        total += v;
      });
      rec.total_cans = total;
      rec.working = total;
      rec.damaged = 0;
      return rec;
    });
  });

  data.godown_rents = optionalSheet(workbook, 'Godown Rents', rows =>
    rows.slice(1)
      .map(r => r.map(v => typeof v === 'string' ? v : cv(v)))
      .filter(vals => vals.some(v => v !== null))
      .map(vals => vals.slice(0, 10))
  );

  // 'TS-Cluster' now reports quality variance, not tanker/route counts — the
  // old tanker_cluster shape has no equivalent in the new workbook (and isn't
  // used by any dashboard page), so it's left empty here.
  data.tanker_cluster = [];

  const bmcuLookup = buildSummaryAndBudget(data, monthKey, monthLabel);

  // Backfill ao/cluster_manager on sheets the new template no longer carries them on.
  data.mbrt_bmcu.forEach(r => {
    const bm = bmcuLookup[String(r.plant_code)];
    if (bm) { r.ao = bm.ao; r.cluster = bm.cluster_manager; }
  });
  data.cans.forEach(r => {
    const bm = bmcuLookup[String(r.plant_code)];
    if (bm) { r.ao = bm.ao; r.cluster_manager = bm.cluster_manager; }
  });

  return data;
}

function extractFromBuffer(buffer, monthKey, monthLabel) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const template = detectTemplate(workbook);
  return template === 'old'
    ? extractOldTemplate(workbook, monthKey, monthLabel)
    : extractNewTemplate(workbook, monthKey, monthLabel);
}

module.exports = { extractFromBuffer, BUDGET_MONTHS };
