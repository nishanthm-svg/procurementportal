export function fmtRs(v) {
  if (v == null) return '—'
  return '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function fmtRsFull(v) {
  if (v == null) return '—'
  return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtNum(v, decimals = 1) {
  if (v == null) return '—'
  return Number(v).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtInt(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('en-IN')
}
