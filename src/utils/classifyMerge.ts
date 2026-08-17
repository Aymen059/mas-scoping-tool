import type { CardData, ClassifiedItem, ServiceData } from '../types'
import { uid } from './id'

const PLACEHOLDER_DESC = /^\[.*\]$/
const PLACEHOLDER_SERVICE_NAME = '[Add service...]'
const SIMILARITY_THRESHOLD = 0.2

type ComponentItem = Extract<ClassifiedItem, { type: 'component' }>
type ServiceItem = Extract<ClassifiedItem, { type: 'service' }>

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/^e\.g\.?\s*/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

/** True for a card that still has its original bracketed placeholder text (e.g. "[SaaS Tool B]")
 * — i.e. one that was never edited by a user, added manually, or previously replaced by
 * classification output. Editing or adding a card always produces non-bracketed text. */
export function isPlaceholderCard(card: CardData): boolean {
  return PLACEHOLDER_DESC.test(card.desc.trim())
}

function placeholderMatchScore(placeholder: CardData, item: ComponentItem): number {
  const itemTokens = normalizeTokens(item.name)
  const nameScore = jaccard(itemTokens, normalizeTokens(placeholder.name))
  const egScore = placeholder.eg ? jaccard(itemTokens, normalizeTokens(placeholder.eg)) : 0
  return Math.max(nameScore, egScore)
}

/** Replaces the best-matching unfilled placeholder card (bracketed desc) per item, in layer/name-similarity
 * order; appends a new card when no placeholder is a good enough match. */
export function mergeComponentsIntoCards(cards: CardData[], items: ComponentItem[]): CardData[] {
  const next = [...cards]
  const usedPlaceholderIds = new Set<string>()
  const appended: CardData[] = []

  for (const item of items) {
    let bestIndex = -1
    let bestScore = 0
    next.forEach((card, index) => {
      if (usedPlaceholderIds.has(card.id) || !PLACEHOLDER_DESC.test(card.desc.trim())) return
      const score = placeholderMatchScore(card, item)
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    if (bestIndex >= 0 && bestScore >= SIMILARITY_THRESHOLD) {
      const placeholder = next[bestIndex]
      usedPlaceholderIds.add(placeholder.id)
      next[bestIndex] = { ...placeholder, name: item.name, desc: item.desc, eg: '', status: item.status, tags: item.tags }
    } else {
      appended.push({ id: uid(), name: item.name, desc: item.desc, eg: '', status: item.status, tags: item.tags })
    }
  }

  return [...next, ...appended]
}

/** Replaces the "[Add service...]" placeholder chip (if present) with the first item, appends the rest. */
export function mergeServicesIntoChips(services: ServiceData[] | undefined, items: ServiceItem[]): ServiceData[] {
  const next = [...(services ?? [])]
  const appended: ServiceData[] = []
  let placeholderIndex = next.findIndex(s => s.name === PLACEHOLDER_SERVICE_NAME)

  for (const item of items) {
    if (placeholderIndex >= 0) {
      next[placeholderIndex] = { id: next[placeholderIndex].id, name: item.name, status: item.service_status }
      placeholderIndex = -1
    } else {
      appended.push({ id: uid(), name: item.name, status: item.service_status })
    }
  }

  return [...next, ...appended]
}
