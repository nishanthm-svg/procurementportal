const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'data', 'procurement.json');
let D = {};

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    D = JSON.parse(raw);
    console.log('Data loaded:', Object.keys(D).map(k => `${k}(${Array.isArray(D[k]) ? D[k].length : 1})`).join(', '));
  } catch (e) {
    console.error('Failed to load data:', e.message);
  }
}
loadData();

// Utility: parse optional filters from query params
function applyFilters(arr, query) {
  let result = arr;
  if (query.cluster) result = result.filter(r => r.cluster_manager === query.cluster || r.cluster === query.cluster);
  if (query.ao) result = result.filter(r => r.ao === query.ao);
  if (query.plant_code) result = result.filter(r => String(r.plant_code) === String(query.plant_code));
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(r => Object.values(r).some(v => v && String(v).toLowerCase().includes(q)));
  }
  return result;
}

function paginate(arr, query) {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 100, 500);
  const total = arr.length;
  const start = (page - 1) * limit;
  return { data: arr.slice(start, start + limit), total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── ROUTES ─────────────────────────────────────────────────────

app.get('/api/summary', (_, res) => res.json(D.summary || {}));

app.get('/api/cluster', (_, res) => res.json(D.cluster || []));

app.get('/api/ao', (req, res) => {
  const filtered = applyFilters(D.ao || [], req.query);
  res.json(filtered);
});

app.get('/api/bmcu', (req, res) => {
  const filtered = applyFilters(D.bmcu || [], req.query);
  res.json(paginate(filtered, req.query));
});

app.get('/api/mpp', (req, res) => {
  const filtered = applyFilters(D.mpp || [], req.query);
  res.json(paginate(filtered, req.query));
});

app.get('/api/budget', (req, res) => {
  const filtered = applyFilters(D.budget || [], req.query);
  res.json(filtered);
});

app.get('/api/budget-vs-actual', (req, res) => {
  const filtered = applyFilters(D.budget_vs_actual || [], req.query);
  res.json(filtered);
});

app.get('/api/lfl/bmcu', (req, res) => {
  const filtered = applyFilters(D.bmcu_lfl || [], req.query);
  res.json(filtered);
});

app.get('/api/lfl/feed', (req, res) => {
  const filtered = applyFilters(D.feed_lfl || [], req.query);
  res.json(filtered);
});

app.get('/api/gprs/ao', (req, res) => {
  const filtered = applyFilters(D.gprs_ao || [], req.query);
  res.json(filtered);
});

app.get('/api/gprs/bmcu', (req, res) => {
  const filtered = applyFilters(D.gprs_bmcu || [], req.query);
  res.json(filtered);
});

app.get('/api/alerts/low-lpd', (req, res) => {
  const filtered = applyFilters(D.low_lpd || [], req.query);
  res.json(paginate(filtered, req.query));
});

app.get('/api/alerts/single-pourer', (req, res) => {
  const filtered = applyFilters(D.single_pourer || [], req.query);
  res.json(filtered);
});

app.get('/api/alerts/low-ts', (req, res) => {
  const filtered = applyFilters(D.low_ts_mpp || [], req.query);
  res.json(paginate(filtered, req.query));
});

app.get('/api/alerts/closed', (req, res) => {
  res.json(D.closed_mpp || []);
});

app.get('/api/recoveries', (req, res) => {
  const filtered = applyFilters(D.recoveries || [], req.query);
  res.json(paginate(filtered, req.query));
});

app.get('/api/manpower', (req, res) => res.json(D.manpower || []));

app.get('/api/cans', (req, res) => {
  const filtered = applyFilters(D.cans || [], req.query);
  res.json(filtered);
});

app.get('/api/mbrt', (req, res) => {
  const filtered = applyFilters(D.mbrt_bmcu || [], req.query);
  res.json(filtered);
});

app.get('/api/enums', (_, res) => {
  const clusters = [...new Set((D.cluster || []).map(r => r.cluster_manager).filter(Boolean))];
  const aos = [...new Set((D.ao || []).map(r => r.ao).filter(Boolean))];
  res.json({ clusters, aos });
});

app.get('/api/health', (_, res) => res.json({ status: 'ok', records: Object.fromEntries(Object.entries(D).map(([k,v]) => [k, Array.isArray(v) ? v.length : 1])) }));

app.listen(PORT, () => console.log(`Procurement API running on http://localhost:${PORT}`));
