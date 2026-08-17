import type { CardData, LayerData, MetaFields, ServiceData, ZoneData } from '../types'
import { S_LABEL, T_LABEL } from '../constants'

interface Origin { x: number; y: number }
interface Box { x: number; y: number; width: number; height: number }

function escapeXML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapText(text: string, maxWidthPx: number, fontSizePx: number, fontFamily: string, ctx: CanvasRenderingContext2D): string[] {
  if (!text.trim() || maxWidthPx <= 0) return []
  ctx.font = `${fontSizePx}px ${fontFamily}`
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidthPx && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function textToTspans(lines: string[], x: number, startY: number, lineHeight: number): string {
  return lines
    .map((line, i) => `<tspan x="${x.toFixed(1)}" y="${(startY + i * lineHeight).toFixed(1)}">${escapeXML(line)}</tspan>`)
    .join('')
}

function rectAt(el: Element, origin: Origin): Box {
  const r = el.getBoundingClientRect()
  return { x: r.left - origin.x, y: r.top - origin.y, width: r.width, height: r.height }
}

function svgRect(box: Box, opts: { fill?: string; stroke?: string; strokeWidth?: number; dashed?: boolean; rx?: number } = {}): string {
  const attrs = [
    `x="${box.x.toFixed(1)}"`, `y="${box.y.toFixed(1)}"`,
    `width="${Math.max(0, box.width).toFixed(1)}"`, `height="${Math.max(0, box.height).toFixed(1)}"`,
  ]
  if (opts.rx) attrs.push(`rx="${opts.rx.toFixed(1)}"`)
  attrs.push(`fill="${opts.fill ?? 'none'}"`)
  if (opts.stroke) attrs.push(`stroke="${opts.stroke}"`, `stroke-width="${opts.strokeWidth ?? 1}"`)
  if (opts.dashed) attrs.push('stroke-dasharray="4,3"')
  return `<rect ${attrs.join(' ')} />`
}

/** A rect with only its top two corners rounded (SVG `<rect>` only supports a single uniform
 * `rx`, so a header nested flush inside a rounded container needs a path instead). */
function svgTopRoundedRect(box: Box, radius: number, fill: string): string {
  const r = Math.max(0, Math.min(radius, box.height, box.width / 2))
  if (r === 0) return svgRect(box, { fill })
  const { x, y, width, height } = box
  const d = [
    `M ${(x + r).toFixed(1)} ${y.toFixed(1)}`,
    `L ${(x + width - r).toFixed(1)} ${y.toFixed(1)}`,
    `A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(x + width).toFixed(1)} ${(y + r).toFixed(1)}`,
    `L ${(x + width).toFixed(1)} ${(y + height).toFixed(1)}`,
    `L ${x.toFixed(1)} ${(y + height).toFixed(1)}`,
    `L ${x.toFixed(1)} ${(y + r).toFixed(1)}`,
    `A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(x + r).toFixed(1)} ${y.toFixed(1)}`,
    'Z',
  ].join(' ')
  return `<path d="${d}" fill="${fill}" />`
}

function svgText(x: number, y: number, content: string, cs: CSSStyleDeclaration, opts: { anchor?: 'start' | 'middle'; fontStyle?: string } = {}): string {
  const fontSize = parseFloat(cs.fontSize) || 9
  const attrs = [
    `x="${x.toFixed(1)}"`, `y="${y.toFixed(1)}"`,
    `font-size="${fontSize}"`, `font-weight="${cs.fontWeight}"`, `fill="${cs.color}"`,
  ]
  if (opts.anchor) attrs.push(`text-anchor="${opts.anchor}"`)
  if (opts.fontStyle) attrs.push(`font-style="${opts.fontStyle}"`)
  if (cs.letterSpacing && cs.letterSpacing !== 'normal') attrs.push(`letter-spacing="${cs.letterSpacing}"`)
  return `<text ${attrs.join(' ')}>${escapeXML(content)}</text>`
}

/** Baseline offset approximating a text box's cap-height from its top edge. */
function baselineY(top: number, fontSize: number): number {
  return top + fontSize * 0.85
}

function buildDataMaps(layers: LayerData[], zones: ZoneData[]) {
  const layerById = new Map(layers.map(l => [l.id, l]))
  const zoneById = new Map(zones.map(z => [z.id, z]))
  const cardById = new Map<string, CardData>()
  for (const l of layers) for (const c of l.cards) cardById.set(c.id, c)
  for (const z of zones) for (const c of z.cards) cardById.set(c.id, c)
  const serviceById = new Map<string, ServiceData>()
  for (const l of layers) for (const s of l.services ?? []) serviceById.set(s.id, s)
  return { layerById, zoneById, cardById, serviceById }
}

function renderContainerRect(el: HTMLElement, origin: Origin): string {
  const box = rectAt(el, origin)
  const cs = getComputedStyle(el)
  return svgRect(box, {
    fill: cs.backgroundColor,
    stroke: cs.borderColor,
    strokeWidth: parseFloat(cs.borderWidth) || undefined,
    dashed: cs.borderStyle === 'dashed',
    rx: parseFloat(cs.borderRadius) || undefined,
  })
}

function renderHeader(headerEl: HTMLElement, labelEl: HTMLElement, label: string, origin: Origin, containerRadius: number): string {
  const headerBox = rectAt(headerEl, origin)
  const headerCs = getComputedStyle(headerEl)
  const parts = [svgTopRoundedRect(headerBox, containerRadius, headerCs.backgroundColor)]

  const labelBox = rectAt(labelEl, origin)
  const labelCs = getComputedStyle(labelEl)
  const fontSize = parseFloat(labelCs.fontSize) || 9
  parts.push(svgText(labelBox.x, baselineY(labelBox.y, fontSize), label, labelCs))
  return parts.join('\n')
}

function renderBadges(cardEl: HTMLElement, card: CardData, origin: Origin): string {
  const badgeEls = Array.from(cardEl.querySelectorAll<HTMLElement>('.badge'))
  const labels = [S_LABEL[card.status], ...card.tags.map(t => T_LABEL[t])]
  const parts: string[] = []
  badgeEls.forEach((badgeEl, i) => {
    const label = labels[i]
    if (label === undefined) return
    const box = rectAt(badgeEl, origin)
    const cs = getComputedStyle(badgeEl)
    parts.push(svgRect(box, { fill: cs.backgroundColor, rx: parseFloat(cs.borderRadius) || undefined }))
    const fontSize = parseFloat(cs.fontSize) || 7
    parts.push(svgText(box.x + box.width / 2, box.y + box.height / 2 + fontSize * 0.35, label, cs, { anchor: 'middle' }))
  })
  return parts.join('\n')
}

function renderWrappedField(fieldEl: HTMLElement, text: string, origin: Origin, measureCtx: CanvasRenderingContext2D, fontStyle?: string): string {
  if (!text.trim()) return ''
  const box = rectAt(fieldEl, origin)
  const cs = getComputedStyle(fieldEl)
  const fontSize = parseFloat(cs.fontSize) || 8.5
  const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.5
  const lines = wrapText(text, box.width, fontSize, cs.fontFamily, measureCtx)
  const tspans = textToTspans(lines, box.x, baselineY(box.y, fontSize), lineHeight)
  const attrs = [`font-size="${fontSize}"`, `fill="${cs.color}"`]
  if (fontStyle) attrs.push(`font-style="${fontStyle}"`)
  return `<text ${attrs.join(' ')}>${tspans}</text>`
}

function renderCard(cardEl: HTMLElement, card: CardData, origin: Origin, measureCtx: CanvasRenderingContext2D): string {
  const parts: string[] = [renderContainerRect(cardEl, origin)]

  const titleEl = cardEl.querySelector<HTMLElement>('.card-title')
  if (titleEl) {
    const box = rectAt(titleEl, origin)
    const cs = getComputedStyle(titleEl)
    const fontSize = parseFloat(cs.fontSize) || 9.5
    parts.push(svgText(box.x, baselineY(box.y, fontSize), card.name, cs))
  }

  const descEl = cardEl.querySelector<HTMLElement>('.card-desc')
  if (descEl) parts.push(renderWrappedField(descEl, card.desc, origin, measureCtx))

  const egEl = cardEl.querySelector<HTMLElement>('.card-eg')
  if (egEl) parts.push(renderWrappedField(egEl, card.eg, origin, measureCtx, getComputedStyle(egEl).fontStyle))

  parts.push(renderBadges(cardEl, card, origin))

  return parts.filter(Boolean).join('\n')
}

function renderServicesCard(el: HTMLElement, origin: Origin): string {
  const parts: string[] = [renderContainerRect(el, origin)]
  const titleEl = el.querySelector<HTMLElement>('.services-card-title')
  if (titleEl) {
    const box = rectAt(titleEl, origin)
    const cs = getComputedStyle(titleEl)
    const fontSize = parseFloat(cs.fontSize) || 9.5
    parts.push(svgText(box.x, baselineY(box.y, fontSize), titleEl.textContent ?? 'Leveraged Cloud Services', cs))
  }
  return parts.join('\n')
}

function renderChip(chipEl: HTMLElement, service: ServiceData, origin: Origin): string {
  const box = rectAt(chipEl, origin)
  const cs = getComputedStyle(chipEl)
  const parts = [svgRect(box, {
    fill: cs.backgroundColor,
    stroke: cs.borderColor,
    strokeWidth: parseFloat(cs.borderWidth) || undefined,
    rx: parseFloat(cs.borderRadius) || box.height / 2,
  })]

  const dotEl = chipEl.querySelector<HTMLElement>('.chip-dot')
  if (dotEl) {
    const dotBox = rectAt(dotEl, origin)
    const dotCs = getComputedStyle(dotEl)
    const cx = dotBox.x + dotBox.width / 2
    const cy = dotBox.y + dotBox.height / 2
    parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(dotBox.width / 2).toFixed(1)}" fill="${dotCs.backgroundColor}" />`)
  }

  const nameEl = chipEl.querySelector<HTMLElement>('.chip-name')
  if (nameEl) {
    const nameBox = rectAt(nameEl, origin)
    const nameCs = getComputedStyle(nameEl)
    const fontSize = parseFloat(nameCs.fontSize) || 8
    parts.push(svgText(nameBox.x, baselineY(nameBox.y, fontSize), service.name, nameCs))
  }

  return parts.join('\n')
}

function renderContainer(
  containerEl: HTMLElement,
  data: LayerData | ZoneData,
  origin: Origin,
  maps: ReturnType<typeof buildDataMaps>,
  measureCtx: CanvasRenderingContext2D,
): string {
  const parts: string[] = [renderContainerRect(containerEl, origin)]
  const containerRadius = parseFloat(getComputedStyle(containerEl).borderRadius) || 0

  const headerEl = containerEl.querySelector<HTMLElement>('.layer-header, .zone-header')
  const labelEl = containerEl.querySelector<HTMLElement>('.layer-name, .zone-name-input')
  if (headerEl && labelEl) parts.push(renderHeader(headerEl, labelEl, data.name, origin, containerRadius))

  for (const cardEl of Array.from(containerEl.querySelectorAll<HTMLElement>('.card'))) {
    const card = maps.cardById.get(cardEl.dataset.cardId ?? '')
    if (card) parts.push(renderCard(cardEl, card, origin, measureCtx))
  }

  const servicesCardEl = containerEl.querySelector<HTMLElement>('.services-card')
  if (servicesCardEl) {
    parts.push(renderServicesCard(servicesCardEl, origin))
    for (const chipEl of Array.from(servicesCardEl.querySelectorAll<HTMLElement>('.chip'))) {
      const service = maps.serviceById.get(chipEl.dataset.serviceId ?? '')
      if (service) parts.push(renderChip(chipEl, service, origin))
    }
  }

  return parts.join('\n')
}

export function exportSvg(
  diagramEl: HTMLElement,
  bottomWrapEl: HTMLElement,
  layers: LayerData[],
  zones: ZoneData[],
  meta: MetaFields,
) {
  const maps = buildDataMaps(layers, zones)

  const diagRect = diagramEl.getBoundingClientRect()
  const wrapRect = bottomWrapEl.getBoundingClientRect()
  const origin: Origin = { x: Math.min(diagRect.left, wrapRect.left), y: diagRect.top }
  const totalWidth = Math.max(diagRect.right, wrapRect.right) - origin.x
  const totalHeight = wrapRect.bottom - origin.y

  const measureCtx = document.createElement('canvas').getContext('2d')!

  const parts: string[] = []
  for (const layerEl of Array.from(diagramEl.querySelectorAll<HTMLElement>('.layer'))) {
    const layer = maps.layerById.get(layerEl.dataset.layerId ?? '')
    if (layer) parts.push(renderContainer(layerEl, layer, origin, maps, measureCtx))
  }
  for (const zoneEl of Array.from(bottomWrapEl.querySelectorAll<HTMLElement>('.zone'))) {
    const zone = maps.zoneById.get(zoneEl.dataset.zoneId ?? '')
    if (zone) parts.push(renderContainer(zoneEl, zone, origin, maps, measureCtx))
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}" width="${totalWidth.toFixed(1)}" height="${totalHeight.toFixed(1)}" font-family="Helvetica Neue, Arial, sans-serif">
${parts.join('\n')}
</svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MAS_Scoping_${meta.client || 'Client'}_${meta.date || 'export'}.svg`
  a.click()
  URL.revokeObjectURL(url)
}
