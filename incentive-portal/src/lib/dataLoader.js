import bmcus from '../data/bmcus.json'
import acoSummary from '../data/aco_summary.json'
import leaderboard from '../data/leaderboard.json'
import meta from '../data/meta.json'

const mppModules = import.meta.glob('../data/mpps/*.json')
const memberModules = import.meta.glob('../data/members/*.json')

export function getBmcus() {
  return bmcus
}

export function getAcoSummary() {
  return acoSummary
}

export function getLeaderboard() {
  return leaderboard
}

export function getMeta() {
  return meta
}

export async function getMpps(bmcuCode) {
  const path = `../data/mpps/${bmcuCode}.json`
  const loader = mppModules[path]
  if (!loader) return []
  const mod = await loader()
  return mod.default
}

export async function getMembers(bmcuCode, mppCode) {
  const path = `../data/members/${bmcuCode}_${mppCode}.json`
  const loader = memberModules[path]
  if (!loader) return []
  const mod = await loader()
  return mod.default
}
