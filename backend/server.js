const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

let QRCode;
try { QRCode = require('qrcode'); } catch (_) { QRCode = null; }

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

// ─── GRIEVANCE / COMPLAINT MANAGEMENT ───────────────────────────

const COMPLAINTS_PATH = path.join(__dirname, 'data', 'complaints.json');

const CATEGORIES = {
  milk_quality:  { label: 'Milk Quality / Adulteration',   dept: 'Quality Control' },
  payment:       { label: 'Payment / Price Issues',        dept: 'Finance & Accounts' },
  equipment:     { label: 'Equipment / Machine Fault',     dept: 'Technical' },
  transport:     { label: 'Transport / Collection Issues', dept: 'Logistics' },
  staff_behavior:{ label: 'Staff Behavior / Misconduct',   dept: 'HR & Administration' },
  veterinary:    { label: 'Veterinary / Animal Health',    dept: 'Veterinary & Extension' },
  membership:    { label: 'Membership / Registration',     dept: 'Member Services' },
  other:         { label: 'Other / General',               dept: 'General Management' },
};

const KEYWORDS = {
  milk_quality:  ['quality','adulteration','fat','snf','sample','test','spoil','smell','dilute','water','rejected','colour','color'],
  payment:       ['payment','price','rate','money','amount','dues','bonus','incentive','salary','deduction','bill','cheque'],
  equipment:     ['machine','equipment','bmc','broken','repair','fault','not working','power','electricity','pump','chiller','meter'],
  transport:     ['transport','vehicle','collection','pickup','late','tanker','delay','driver','route','lorry','truck'],
  staff_behavior:['staff','employee','behavior','rude','corrupt','bribe','harassment','misconduct','agent','collector','officer'],
  veterinary:    ['animal','cow','buffalo','sick','disease','medicine','vet','treatment','fodder','feed','cattle','health'],
  membership:    ['member','registration','id','card','enroll','joining','share','passbook','account','society'],
};

const SLA_HOURS = 48;

function autoCategory(text) {
  const lower = (text || '').toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return 'other';
}

function loadComplaints() {
  try {
    if (!fs.existsSync(COMPLAINTS_PATH)) return [];
    return JSON.parse(fs.readFileSync(COMPLAINTS_PATH, 'utf8'));
  } catch { return []; }
}

function saveComplaints(data) {
  fs.writeFileSync(COMPLAINTS_PATH, JSON.stringify(data, null, 2));
}

function attachOverdue(complaint) {
  const active = complaint.status !== 'resolved' && complaint.status !== 'closed';
  const age = Date.now() - new Date(complaint.submittedAt).getTime();
  return { ...complaint, isOverdue: active && age > SLA_HOURS * 3600000 };
}

// QR code image for the farmer complaint form
app.get('/api/grievance/qr', async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const url = `${proto}://${host}/complaint`;
  if (!QRCode) return res.json({ url, qrDataUrl: null });
  try {
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1a4731', light: '#ffffff' } });
    res.json({ url, qrDataUrl });
  } catch (e) {
    res.json({ url, qrDataUrl: null });
  }
});

// List complaints
app.get('/api/grievance/complaints', (req, res) => {
  let data = loadComplaints().map(attachOverdue);
  if (req.query.status)   data = data.filter(c => c.status === req.query.status);
  if (req.query.category) data = data.filter(c => c.category === req.query.category);
  if (req.query.dept)     data = data.filter(c => c.department === req.query.dept);
  data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json(data);
});

// Submit new complaint (called from farmer QR form)
app.post('/api/grievance/complaints', (req, res) => {
  const data = loadComplaints();
  const num  = String(data.length + 1).padStart(4, '0');
  const year = new Date().getFullYear();
  const id   = `GRV-${year}-${num}`;
  const { farmerName, villageName, mppCode, bmcuCode, bmcuName, transcription, categoryOverride } = req.body;
  if (!farmerName || !villageName) return res.status(400).json({ error: 'farmerName and villageName are required' });
  const category = categoryOverride || autoCategory(transcription || '');
  const complaint = {
    id,
    submittedAt: new Date().toISOString(),
    farmerName: String(farmerName).trim(),
    villageName: String(villageName).trim(),
    mppCode:  String(mppCode  || '').trim(),
    bmcuCode: String(bmcuCode || '').trim(),
    bmcuName: String(bmcuName || '').trim(),
    transcription: String(transcription || '').trim(),
    category,
    department: CATEGORIES[category]?.dept || 'General Management',
    status: 'open',
    statusHistory: [{ status: 'open', at: new Date().toISOString(), by: 'system' }],
    resolvedAt: null,
    resolutionHours: null,
    notes: '',
  };
  data.push(complaint);
  saveComplaints(data);
  res.json({ success: true, complaint: attachOverdue(complaint) });
});

// Update complaint status / notes
app.patch('/api/grievance/complaints/:id', (req, res) => {
  const data = loadComplaints();
  const idx  = data.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Complaint not found' });
  const { status, notes } = req.body;
  const c = { ...data[idx] };
  if (status && status !== c.status) {
    c.status = status;
    c.statusHistory.push({ status, at: new Date().toISOString(), by: 'admin' });
    if (status === 'resolved' || status === 'closed') {
      c.resolvedAt     = new Date().toISOString();
      c.resolutionHours = Math.round((new Date(c.resolvedAt) - new Date(c.submittedAt)) / 360000) / 10;
    }
  }
  if (notes !== undefined) c.notes = String(notes);
  data[idx] = c;
  saveComplaints(data);
  res.json({ success: true, complaint: attachOverdue(c) });
});

// Aggregate stats for dashboard
app.get('/api/grievance/stats', (req, res) => {
  const data = loadComplaints().map(attachOverdue);
  const total      = data.length;
  const open       = data.filter(c => c.status === 'open').length;
  const inProgress = data.filter(c => c.status === 'in_progress').length;
  const resolved   = data.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const overdue    = data.filter(c => c.isOverdue).length;

  const byCat  = {};
  const byDept = {};
  const byStatus = {};
  data.forEach(c => {
    byCat[c.category]   = (byCat[c.category]   || 0) + 1;
    byDept[c.department]= (byDept[c.department] || 0) + 1;
    byStatus[c.status]  = (byStatus[c.status]   || 0) + 1;
  });

  const doneList = data.filter(c => c.resolutionHours != null);
  const avgResolutionHours = doneList.length
    ? Math.round(doneList.reduce((s, c) => s + c.resolutionHours, 0) / doneList.length * 10) / 10
    : 0;

  res.json({ total, open, inProgress, resolved, overdue, byCat, byDept, byStatus, avgResolutionHours, slaHours: SLA_HOURS });
});

// ─── END GRIEVANCE ───────────────────────────────────────────────

// Serve built frontend
const DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, () => console.log(`Procurement API running on http://localhost:${PORT}`));
