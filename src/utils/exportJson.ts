import type { LayerData, MetaFields, ZoneData } from '../types'

const SCHEMA_VERSION = '1.0'

export function buildExportPayload(layers: LayerData[], zones: ZoneData[], meta: MetaFields) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    meta,
    layers,
    zones,
  }
}

export function exportJson(layers: LayerData[], zones: ZoneData[], meta: MetaFields) {
  const payload = buildExportPayload(layers, zones, meta)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MAS_Scoping_${meta.client || 'Client'}_${meta.date || 'export'}.json`
  a.click()
  URL.revokeObjectURL(url)
}
