import { useCallback, useEffect, useRef, useState } from 'react'
import type { CardData, ClassifiedItem, LayerData, MetaFields, ServiceData, Status, SvcStatus, ZoneData } from '../types'
import { DEFAULT_LAYERS, DEFAULT_ZONES } from '../data/defaultTemplate'
import { S_CYCLE, SVC_CYCLE } from '../constants'
import { uid } from '../utils/id'
import { isPlaceholderCard, mergeComponentsIntoCards, mergeServicesIntoChips } from '../utils/classifyMerge'

const STORAGE_KEY = 'mas-boundary-scoping-state-v1'
const MAX_HISTORY = 50

interface Snapshot {
  layers: LayerData[]
  zones: ZoneData[]
}

interface PersistedState extends Snapshot {
  meta: MetaFields
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function loadInitial(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.layers) && Array.isArray(parsed.zones)) {
        return parsed
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { layers: clone(DEFAULT_LAYERS), zones: clone(DEFAULT_ZONES), meta: { consultant: '', client: '', date: '' } }
}

export function useDiagramState() {
  const initial = useRef(loadInitial())
  const [snapshot, setSnapshotState] = useState<Snapshot>({ layers: initial.current.layers, zones: initial.current.zones })
  const [meta, setMeta] = useState<MetaFields>(initial.current.meta)
  const history = useRef<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] })

  const { layers, zones } = snapshot

  useEffect(() => {
    const state: PersistedState = { layers, zones, meta }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full/unavailable — skip silently
    }
  }, [layers, zones, meta])

  /** Applies a diagram mutation and records the prior state for undo. */
  const commit = useCallback((updater: (current: Snapshot) => Snapshot) => {
    setSnapshotState(current => {
      const next = updater(current)
      if (next === current) return current
      history.current.past.push(current)
      if (history.current.past.length > MAX_HISTORY) history.current.past.shift()
      history.current.future = []
      return next
    })
  }, [])

  const undo = useCallback(() => {
    setSnapshotState(current => {
      const previous = history.current.past.pop()
      if (!previous) return current
      history.current.future.push(current)
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    setSnapshotState(current => {
      const next = history.current.future.pop()
      if (!next) return current
      history.current.past.push(current)
      return next
    })
  }, [])

  const getList = useCallback((containerId: string): CardData[] | null => {
    const l = layers.find(l => l.id === containerId)
    if (l) return l.cards
    const z = zones.find(z => z.id === containerId)
    if (z) return z.cards
    return null
  }, [layers, zones])

  const isLayer = useCallback((containerId: string) => layers.some(l => l.id === containerId), [layers])

  const updateCardField = useCallback((containerId: string, cardId: string, field: 'name' | 'desc' | 'eg', value: string) => {
    const mutate = (list: CardData[]) => list.map(c => c.id === cardId ? { ...c, [field]: value } : c)
    commit(s => isLayer(containerId)
      ? { ...s, layers: s.layers.map(l => l.id === containerId ? { ...l, cards: mutate(l.cards) } : l) }
      : { ...s, zones: s.zones.map(z => z.id === containerId ? { ...z, cards: mutate(z.cards) } : z) })
  }, [isLayer, commit])

  const cycleStatus = useCallback((containerId: string, cardId: string) => {
    const mutate = (list: CardData[]) => list.map(c => {
      if (c.id !== cardId) return c
      const i = S_CYCLE.indexOf(c.status)
      const status: Status = S_CYCLE[(i + 1) % S_CYCLE.length]
      return { ...c, status }
    })
    commit(s => isLayer(containerId)
      ? { ...s, layers: s.layers.map(l => l.id === containerId ? { ...l, cards: mutate(l.cards) } : l) }
      : { ...s, zones: s.zones.map(z => z.id === containerId ? { ...z, cards: mutate(z.cards) } : z) })
  }, [isLayer, commit])

  const deleteCard = useCallback((containerId: string, cardId: string) => {
    commit(s => isLayer(containerId)
      ? { ...s, layers: s.layers.map(l => l.id === containerId ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } : l) }
      : { ...s, zones: s.zones.map(z => z.id === containerId ? { ...z, cards: z.cards.filter(c => c.id !== cardId) } : z) })
  }, [isLayer, commit])

  const saveCard = useCallback((containerId: string, cardId: string | null, data: { name: string; desc: string; status: Status; tags: CardData['tags'] }) => {
    commit(s => isLayer(containerId)
      ? {
          ...s,
          layers: s.layers.map(l => {
            if (l.id !== containerId) return l
            if (cardId) return { ...l, cards: l.cards.map(c => c.id === cardId ? { ...c, ...data } : c) }
            return { ...l, cards: [...l.cards, { id: uid(), eg: '', ...data }] }
          }),
        }
      : {
          ...s,
          zones: s.zones.map(z => {
            if (z.id !== containerId) return z
            if (cardId) return { ...z, cards: z.cards.map(c => c.id === cardId ? { ...c, ...data } : c) }
            return { ...z, cards: [...z.cards, { id: uid(), eg: '', ...data }] }
          }),
        })
  }, [isLayer, commit])

  const renameLayer = useCallback((layerId: string, name: string) => {
    commit(s => ({ ...s, layers: s.layers.map(l => l.id === layerId ? { ...l, name } : l) }))
  }, [commit])

  const setLayerColor = useCallback((layerId: string, color: string) => {
    commit(s => ({ ...s, layers: s.layers.map(l => l.id === layerId ? { ...l, color } : l) }))
  }, [commit])

  const addLayer = useCallback((name: string, color: string) => {
    commit(s => ({ ...s, layers: [...s.layers, { id: uid(), name: name.toUpperCase(), color, cards: [] }] }))
  }, [commit])

  const deleteLayer = useCallback((layerId: string) => {
    commit(s => ({ ...s, layers: s.layers.filter(l => l.id !== layerId) }))
  }, [commit])

  const reorderLayers = useCallback((sourceId: string, targetId: string) => {
    commit(s => {
      const si = s.layers.findIndex(l => l.id === sourceId)
      const ti = s.layers.findIndex(l => l.id === targetId)
      if (si < 0 || ti < 0) return s
      const nextLayers = [...s.layers]
      const [moved] = nextLayers.splice(si, 1)
      nextLayers.splice(ti, 0, moved)
      return { ...s, layers: nextLayers }
    })
  }, [commit])

  const renameZone = useCallback((zoneId: string, name: string) => {
    commit(s => ({ ...s, zones: s.zones.map(z => z.id === zoneId ? { ...z, name } : z) }))
  }, [commit])

  const addZone = useCallback((name: string, color: string) => {
    const { r, g, b } = hexToRgbLocal(color)
    const newZone: ZoneData = {
      id: uid(),
      name: name.toUpperCase(),
      color,
      bgColor: `rgba(${r},${g},${b},0.08)`,
      borderColor: color,
      headerColor: `rgba(${r},${g},${b},0.15)`,
      titleColor: darkenLocal(color, 0.2),
      cards: [],
      fixedWidth: '340px',
    }
    commit(s => ({ ...s, zones: [...s.zones, newZone] }))
  }, [commit])

  const deleteZone = useCallback((zoneId: string) => {
    commit(s => ({ ...s, zones: s.zones.filter(z => z.id !== zoneId) }))
  }, [commit])

  const addService = useCallback((layerId: string): string => {
    const svcId = uid()
    commit(s => ({
      ...s,
      layers: s.layers.map(l => l.id === layerId
        ? { ...l, services: [...(l.services ?? []), { id: svcId, name: '[Service name]', status: 'pending' as SvcStatus }] }
        : l),
    }))
    return svcId
  }, [commit])

  const updateServiceName = useCallback((layerId: string, svcId: string, name: string) => {
    commit(s => ({
      ...s,
      layers: s.layers.map(l => l.id === layerId
        ? { ...l, services: (l.services ?? []).map(sv => sv.id === svcId ? { ...sv, name } : sv) }
        : l),
    }))
  }, [commit])

  const cycleServiceStatus = useCallback((layerId: string, svcId: string) => {
    commit(s => ({
      ...s,
      layers: s.layers.map(l => {
        if (l.id !== layerId) return l
        return {
          ...l,
          services: (l.services ?? []).map(sv => {
            if (sv.id !== svcId) return sv
            const i = SVC_CYCLE.indexOf(sv.status)
            return { ...sv, status: SVC_CYCLE[(i + 1) % SVC_CYCLE.length] }
          }),
        }
      }),
    }))
  }, [commit])

  const deleteService = useCallback((layerId: string, svcId: string) => {
    commit(s => ({
      ...s,
      layers: s.layers.map(l => l.id === layerId
        ? { ...l, services: (l.services ?? []).filter(sv => sv.id !== svcId) }
        : l),
    }))
  }, [commit])

  const reset = useCallback(() => {
    commit(() => ({ layers: clone(DEFAULT_LAYERS), zones: clone(DEFAULT_ZONES) }))
    setMeta({ consultant: '', client: '', date: '' })
  }, [commit])

  const mergeClassifiedItems = useCallback((items: ClassifiedItem[]) => {
    const componentsByContainer = new Map<string, Extract<ClassifiedItem, { type: 'component' }>[]>()
    const servicesByLayer = new Map<string, Extract<ClassifiedItem, { type: 'service' }>[]>()

    for (const item of items) {
      if (item.type === 'service') {
        const arr = servicesByLayer.get(item.layer_id) ?? []
        arr.push(item)
        servicesByLayer.set(item.layer_id, arr)
      } else {
        const arr = componentsByContainer.get(item.layer_id) ?? []
        arr.push(item)
        componentsByContainer.set(item.layer_id, arr)
      }
    }

    // Clear untouched default placeholder cards (still-bracketed, e.g. "[SaaS Tool B]") before
    // merging, so the result reflects only real content — classified plus anything a user already
    // edited or added by hand. Re-running Auto-Generate is safe: by the second run nothing bracketed
    // is left to strip, so it merges alongside prior real content instead of clearing it.
    commit(s => ({
      layers: s.layers.map(l => {
        const strippedCards = l.cards.filter(c => !isPlaceholderCard(c))
        const comps = componentsByContainer.get(l.id)
        const svcs = servicesByLayer.get(l.id)
        return {
          ...l,
          cards: comps ? mergeComponentsIntoCards(strippedCards, comps) : strippedCards,
          services: svcs ? mergeServicesIntoChips(l.services, svcs) : l.services,
        }
      }),
      zones: s.zones.map(z => {
        const strippedCards = z.cards.filter(c => !isPlaceholderCard(c))
        const comps = componentsByContainer.get(z.id)
        return { ...z, cards: comps ? mergeComponentsIntoCards(strippedCards, comps) : strippedCards }
      }),
    }))
  }, [commit])

  return {
    layers, zones, meta, setMeta,
    getList,
    updateCardField, cycleStatus, deleteCard, saveCard,
    renameLayer, setLayerColor, addLayer, deleteLayer, reorderLayers,
    renameZone, addZone, deleteZone,
    addService, updateServiceName, cycleServiceStatus, deleteService,
    reset,
    mergeClassifiedItems,
    undo, redo,
  }
}

function hexToRgbLocal(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}
function darkenLocal(hex: string, a = 0.15) {
  const { r, g, b } = hexToRgbLocal(hex)
  const m = (c: number) => Math.round(c * (1 - a))
  return `rgb(${m(r)},${m(g)},${m(b)})`
}

export type DiagramState = ReturnType<typeof useDiagramState>
export type { ServiceData }
