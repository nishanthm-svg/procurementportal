import { fmtNum, fmtRs } from './format'

const PER_SLIDE = 14

function sanitize(name) {
  return String(name).replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')
}

export async function buildMeetingPptx({ bmcu, mpp, members }) {
  const pptxgen = (await import('pptxgenjs')).default
  const pres = new pptxgen()
  pres.defineLayout({ name: 'WIDE', width: 10, height: 5.63 })
  pres.layout = 'WIDE'

  const totalQty = members.reduce((s, m) => s + m.qty, 0)
  const totalBonus = members.reduce((s, m) => s + m.bonus, 0)
  const top5 = [...members].sort((a, b) => b.bonus - a.bonus).slice(0, 5)
  const sorted = [...members].sort((a, b) => b.bonus - a.bonus)

  // --- Title slide ---
  let slide = pres.addSlide()
  slide.background = { color: '0EA5E9' }
  slide.addText('Producer Incentive — Village Meeting', {
    x: 0.4, y: 1.5, w: 9.2, h: 0.9, fontSize: 30, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
  })
  slide.addText(`${mpp.name} MPP  ·  ${bmcu.name} BMCU`, {
    x: 0.4, y: 2.5, w: 9.2, h: 0.6, fontSize: 20, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
  })
  slide.addText(`ACO: ${bmcu.aco}`, {
    x: 0.4, y: 3.1, w: 9.2, h: 0.4, fontSize: 14, color: 'E0F2FE', align: 'center', fontFace: 'Arial',
  })
  slide.addText(new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.4, y: 4.8, w: 9.2, h: 0.4, fontSize: 12, color: 'E0F2FE', align: 'center', fontFace: 'Arial',
  })

  // --- Summary slide ---
  slide = pres.addSlide()
  slide.addText('Meeting Summary', { x: 0.4, y: 0.3, w: 9.2, h: 0.6, fontSize: 24, bold: true, color: '0F172A', fontFace: 'Arial' })
  slide.addTable(
    [
      [{ text: 'Total Producers', options: { bold: true, fill: { color: 'F1F5F9' } } }, { text: String(members.length) }],
      [{ text: 'Total Milk Quantity Poured (L)', options: { bold: true, fill: { color: 'F1F5F9' } } }, { text: fmtNum(totalQty) }],
      [{ text: 'Total Bonus / Price Incentive Amount', options: { bold: true, fill: { color: 'F1F5F9' } } }, { text: fmtRs(totalBonus) }],
    ],
    { x: 0.8, y: 1.3, w: 8.4, colW: [5.5, 2.9], fontSize: 16, border: { type: 'solid', color: 'CBD5E1', pt: 1 }, autoPage: false, fontFace: 'Arial' }
  )

  // --- Top 5 slide ---
  slide = pres.addSlide()
  slide.background = { color: 'FFFBEB' }
  slide.addText('🏆 Top 5 Highest Bonus', { x: 0.4, y: 0.3, w: 9.2, h: 0.6, fontSize: 24, bold: true, color: '92400E', fontFace: 'Arial' })
  const top5Rows = top5.map((m, i) => ([
    { text: String(i + 1), options: { bold: true, align: 'center' } },
    { text: m.name },
    { text: fmtNum(m.qty), options: { align: 'right' } },
    { text: fmtRs(m.bonus), options: { align: 'right', bold: true, color: '12A362' } },
  ]))
  slide.addTable(
    [[{ text: '#' }, { text: 'Producer' }, { text: 'Qty (L)' }, { text: 'Bonus' }].map(c => ({ text: c.text, options: { bold: true, fill: { color: 'FDE68A' } } })), ...top5Rows],
    { x: 0.6, y: 1.2, w: 8.8, colW: [0.7, 4.3, 1.9, 1.9], fontSize: 16, border: { type: 'solid', color: 'FDE68A', pt: 1 }, fontFace: 'Arial' }
  )

  // --- Paged full member list, high to low ---
  for (let start = 0; start < sorted.length; start += PER_SLIDE) {
    const chunk = sorted.slice(start, start + PER_SLIDE)
    slide = pres.addSlide()
    slide.addText(
      `All Producers — Highest to Lowest Bonus (${start + 1}–${Math.min(start + PER_SLIDE, sorted.length)} of ${sorted.length})`,
      { x: 0.4, y: 0.25, w: 9.2, h: 0.5, fontSize: 16, bold: true, color: '0F172A', fontFace: 'Arial' }
    )
    const header = [{ text: '#' }, { text: 'Producer' }, { text: 'Qty (L)' }, { text: 'Bonus (Rs.)' }].map(c => ({
      text: c.text, options: { bold: true, fill: { color: 'E0F2FE' }, fontFace: 'Arial' },
    }))
    const rows = chunk.map((m, idx) => ([
      { text: String(start + idx + 1) },
      { text: m.name },
      { text: fmtNum(m.qty), options: { align: 'right' } },
      { text: fmtRs(m.bonus), options: { align: 'right' } },
    ]))
    slide.addTable([header, ...rows], {
      x: 0.4, y: 0.9, w: 9.2, colW: [0.6, 4.6, 2.0, 2.0], fontSize: 11,
      border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, fontFace: 'Arial',
    })
  }

  // --- Closing totals slide ---
  slide = pres.addSlide()
  slide.background = { color: '0EA5E9' }
  slide.addText('Thank You', { x: 0.4, y: 2.0, w: 9.2, h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial' })
  slide.addText(`Total Milk Poured: ${fmtNum(totalQty)} L   ·   Total Bonus Disbursed: ${fmtRs(totalBonus)}`, {
    x: 0.4, y: 2.9, w: 9.2, h: 0.5, fontSize: 16, color: 'E0F2FE', align: 'center', fontFace: 'Arial',
  })

  const fileName = `${sanitize(bmcu.name)}_${sanitize(mpp.name)}_Incentive_Meeting.pptx`
  await pres.writeFile({ fileName })
}
