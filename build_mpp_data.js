/**
 * MPP Data Processor — uses PLANT_CODE + MPP_CODE as composite key
 */

const XLSX = require('./node_modules/xlsx')
const fs   = require('fs')
const path = require('path')

const DESKTOP  = 'C:/Users/nishanth.m/Desktop'
const TO_UPD   = `${DESKTOP}/To be updated`
const OUT_FILE = path.join(__dirname, 'mpp-scorecard/public/mpp-data.json')

const NAME_MAP = {
  'GANGADHAR':         'M GANGADHAR',
  'NAGABHUSHANAM':     'Y NAGHABHUSHAN',
  'SAHADEV REDDY':     'T SAHADEVA REDDY',
  'SHANKAR':           'M SANKAR',
  'A RAGHUNATH REDDY': 'A RAGHUNATH',
}
const norm = n => NAME_MAP[n.trim()] || n.trim()
const num  = v  => isNaN(+v) ? 0 : +v

/* ═══════════════════════════════════════════
   1. MPP SCORE CARD  (MPP wise sheet)
   Key = PLANT_CODE + '_' + MPP_CODE  (2903 unique combos)
   ═══════════════════════════════════════════ */
console.log('Reading MPP score card updated.xlsx …')
const scWb  = XLSX.readFile(`${DESKTOP}/MPP score card updated.xlsx`)
const mppWs = scWb.Sheets['MPP wise']
const memWs = scWb.Sheets['Member Wise']

const mppRows = XLSX.utils.sheet_to_json(mppWs, { defval: '' })
const memRows = XLSX.utils.sheet_to_json(memWs, { defval: '' })
console.log(`  MPP wise: ${mppRows.length} rows | Member Wise: ${memRows.length} rows`)

// mppMetrics indexed by mppKey = plant_mppCode
const mppMetrics = {}

mppRows.forEach(r => {
  const plant = String(r['PLANT CODE'] || '').trim()
  const code  = String(r['MPP CODE']   || '').trim()
  if (!plant || !code) return
  const mppKey = `${plant}_${code}`

  const ts      = num(r['TS'])
  const lpd     = num(r['  Avg Procuremet (LPD)'] || r[' Avg Procuremet (LPD)'] || 0)
  const cf      = num(r['CF Usage in Gms'] || 0)
  const gprs    = num(r['GPRS %'] || 0)
  const sahayak = num(r[' Sahayak Commission %'] || r['Sahayak Commission %'] || 0)
  const totMem  = num(r[' Total Reg. Members'] || r['Total Reg. Members'] || 0)
  const actMem  = num(r[' Active Members'] || r['Active Members'] || 0)
  const score   = num(r['Avg. MPP Score Card'] || 0)
  const exec    = norm(String(r['NAME OF THE EXECUTIVE'] || '').trim())

  mppMetrics[mppKey] = {
    plant,
    plantName: String(r['PLANT NAME'] || '').trim(),
    code,
    name:      String(r['MPP NAME'] || '').trim(),
    aco:       String(r['NAME OF THE ACO'] || '').trim(),
    exec,
    ts:       +ts.toFixed(2),
    lpd:      +lpd.toFixed(2),
    cf:       +cf.toFixed(2),
    gprs:     +gprs.toFixed(2),
    sahayak:  +sahayak.toFixed(2),
    totMem:   Math.round(totMem),
    actMem:   Math.round(actMem),
    score:    Math.round(score),
  }
})
console.log(`  Scorecard metrics: ${Object.keys(mppMetrics).length} unique plant_mppCode combos`)

/* ═══════════════════════════════════════════
   2. MEMBER DATA  (Member Wise sheet)
   ═══════════════════════════════════════════ */
const execMap = {}  // exec → { mppKey → mppEntry }

memRows.forEach(r => {
  const plant    = String(r['PLANT CODE'] || '').trim()
  const mppCode  = String(r['MPP CODE']   || '').trim()
  if (!plant || !mppCode) return

  const mppKey   = `${plant}_${mppCode}`
  const m        = mppMetrics[mppKey] || {}
  const exec     = m.exec || norm(String(r['Name of the Executive'] || '').trim())
  if (!exec) return

  const memCode  = String(r['MEMBER CODE'] || '').trim()
  const memName  = String(r['MEMBER NAME'] || '').trim()
  if (!memCode) return

  const days = num(r[' No. of Days'] || r['No. of Days'] || 0)
  const lpd  = num(r['LPD'] || 0)
  const ts   = num(r['Average TS'] || 0)
  const cf   = num(r['Average CF in Gms'] || 0)
  const pay  = num(r['Final payment'] || r[' Milk Amount'] || 0)

  if (!execMap[exec]) execMap[exec] = {}
  if (!execMap[exec][mppKey]) {
    execMap[exec][mppKey] = {
      mppKey,
      plant,
      plantName: m.plantName || String(r['BMCU NAME'] || '').trim(),
      code:      mppCode,
      name:      m.name      || String(r['MPP Name'] || '').trim(),
      bmcu:      m.plantName || String(r['BMCU NAME'] || '').trim(),
      aco:       m.aco       || '',
      totMem:    m.totMem    || 0,
      actMem:    m.actMem    || 0,
      lpd:       m.lpd       || 0,
      ts:        m.ts        || 0,
      cf:        m.cf        || 0,
      gprs:      m.gprs      || 0,
      sahayak:   m.sahayak   || 0,
      score:     m.score     || 0,
      members:   [],
    }
  }
  execMap[exec][mppKey].members.push({
    code: memCode,
    name: memName,
    days,
    lpd:  +lpd.toFixed(2),
    ts:   +ts.toFixed(2),
    cf:   +cf.toFixed(2),
    pay:  Math.round(pay),
  })
})

const memberData = []
Object.entries(execMap).forEach(([exec, mpps]) => {
  Object.values(mpps).forEach(mpp => memberData.push({ exec, ...mpp }))
})
console.log(`  memberData: ${memberData.length} MPPs across ${Object.keys(execMap).length} execs`)

// execMPPList: scorecard view (one entry per mppKey from MPP wise sheet)
const execMPPList = {}
Object.values(mppMetrics).forEach(m => {
  const exec = m.exec
  if (!exec) return
  if (!execMPPList[exec]) execMPPList[exec] = []
  execMPPList[exec].push({
    mppKey:    `${m.plant}_${m.code}`,
    plant:     m.plant,
    plantName: m.plantName,
    code:      m.code,
    name:      m.name,
    aco:       m.aco,
    totMem:    m.totMem,
    actMem:    m.actMem,
    lpd:       m.lpd,
    ts:        m.ts,
    cf:        m.cf,
    gprs:      m.gprs,
    sahayak:   m.sahayak,
    score:     m.score,
  })
})
console.log(`  execMPPList: ${Object.keys(execMPPList).length} execs`)
Object.entries(execMPPList).forEach(([e,v]) => console.log(`    ${e}: ${v.length} MPPs`))

/* ═══════════════════════════════════════════
   3. CLOSED MPPs
   ═══════════════════════════════════════════ */
console.log("\nReading Closed MPP's.xlsx …")
const closedWb   = XLSX.readFile(`${TO_UPD}/Closed MPP's.xlsx`)
const closedWs   = closedWb.Sheets["MPP's"] || closedWb.Sheets[closedWb.SheetNames[0]]
const closedRows = XLSX.utils.sheet_to_json(closedWs, { defval: '' })
console.log(`  Rows: ${closedRows.length}`)

const closedMPPs = {}
closedRows.forEach(r => {
  const exec = norm(String(r['Name of the Executive'] || '').trim())
  if (!exec) return
  if (!closedMPPs[exec]) closedMPPs[exec] = []
  closedMPPs[exec].push({
    unkey:       String(r['Unkey'] || r['MPP Code'] || '').trim(),
    plantCode:   String(r['Plant Code'] || '').trim(),
    plantName:   String(r['Plant Name'] || '').trim(),
    mppCode:     String(r['MPP Code']   || '').trim(),
    mppName:     String(r['MPP Name']   || '').trim(),
    hamletName:  String(r['Hamlet Name']|| '').trim(),
    dateStarted: String(r['Date of starting'] || '').trim(),
    aco:         String(r['Name of the ACO']  || '').trim(),
  })
})
const closedExecs = Object.keys(closedMPPs)
const closedTotal = closedExecs.reduce((a,e)=>a+closedMPPs[e].length, 0)
console.log(`  closedMPPs: ${closedTotal} entries across ${closedExecs.length} execs`)

/* ═══════════════════════════════════════════
   4. UNCOVERED MPPs (new file)
   ═══════════════════════════════════════════ */
console.log("\nReading Uncovered MPP's list (1).xlsx …")
const uncovWb   = XLSX.readFile(`${TO_UPD}/Uncovered MPP's list (1).xlsx`)
const uncovWs   = uncovWb.Sheets['Sheet1']
if (!uncovWs) throw new Error('Sheet "Sheet1" not found')
const uncovRows = XLSX.utils.sheet_to_json(uncovWs, { defval: '' })
console.log(`  Rows: ${uncovRows.length}`)

const uncoveredMPPs = {}
uncovRows.forEach(r => {
  const exec = norm(String(r['Executive'] || '').trim())
  if (!exec) return
  if (!uncoveredMPPs[exec]) uncoveredMPPs[exec] = []
  uncoveredMPPs[exec].push({
    hamletCode:  String(r['Hamlet code']  || '').trim(),
    hamletName:  String(r['Hamlet Name']  || '').trim(),
    villageName: String(r['Village Name'] || '').trim(),
    tahsilName:  String(r['Tahsil Name']  || '').trim(),
    distName:    String(r['Dist Name']    || '').trim(),
    status:      String(r['MPP Status']   || '').trim(),
  })
})
const uncovExecs = Object.keys(uncoveredMPPs)
const uncovTotal = uncovExecs.reduce((a,e)=>a+uncoveredMPPs[e].length, 0)
console.log(`  uncoveredMPPs: ${uncovTotal} entries across ${uncovExecs.length} execs`)

/* ═══════════════════════════════════════════
   5. WRITE OUTPUT
   ═══════════════════════════════════════════ */
const output = { memberData, execMPPList, closedMPPs, uncoveredMPPs }
const json   = JSON.stringify(output)
fs.writeFileSync(OUT_FILE, json)
const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2)
console.log(`\n✓ Written to ${OUT_FILE}`)
console.log(`  Size: ${sizeMB} MB`)
console.log(`  memberData:    ${memberData.length} entries`)
console.log(`  execMPPList:   ${Object.keys(execMPPList).length} execs`)
console.log(`  closedMPPs:    ${closedTotal} entries / ${closedExecs.length} execs`)
console.log(`  uncoveredMPPs: ${uncovTotal} entries / ${uncovExecs.length} execs`)
