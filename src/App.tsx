import { useRef, useState } from 'react'
import { useDiagramState } from './state/useDiagramState'
import { useUndoRedoShortcuts } from './hooks/useUndoRedoShortcuts'
import { Toolbar } from './components/Toolbar'
import { Diagram } from './components/Diagram'
import { BottomRow } from './components/BottomRow'
import { Legend } from './components/Legend'
import { CardModal } from './components/modals/CardModal'
import { LayerModal } from './components/modals/LayerModal'
import { ZoneModal } from './components/modals/ZoneModal'
import { UploadModal } from './components/modals/UploadModal'
import { exportPng } from './utils/exportPng'
import { exportJson } from './utils/exportJson'
import { exportSvg } from './utils/exportSvg'
import type { CardData } from './types'

type EditTarget = { containerId: string; cardId: string | null } | null

function App() {
  const state = useDiagramState()
  const diagramRef = useRef<HTMLDivElement>(null)
  const bottomWrapRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)

  useUndoRedoShortcuts(state.undo, state.redo)

  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [layerModalOpen, setLayerModalOpen] = useState(false)
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const editingCard: CardData | null = editTarget?.cardId
    ? state.getList(editTarget.containerId)?.find(c => c.id === editTarget.cardId) ?? null
    : null

  const handleReset = () => {
    if (window.confirm('Reset to default template? All changes will be lost.')) {
      state.reset()
    }
  }

  const handleExportPng = async () => {
    if (!diagramRef.current || !bottomWrapRef.current || !legendRef.current) return
    setExporting(true)
    try {
      await exportPng(diagramRef.current, bottomWrapRef.current, legendRef.current, state.meta)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportJson = () => {
    setExporting(true)
    try {
      exportJson(state.layers, state.zones, state.meta)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportSvg = () => {
    if (!diagramRef.current || !bottomWrapRef.current) return
    setExporting(true)
    try {
      exportSvg(diagramRef.current, bottomWrapRef.current, state.layers, state.zones, state.meta)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Toolbar
        meta={state.meta}
        onMetaChange={state.setMeta}
        onAddLayer={() => setLayerModalOpen(true)}
        onReset={handleReset}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onExportSvg={handleExportSvg}
        onUpload={() => setUploadModalOpen(true)}
        exporting={exporting}
      />

      <Diagram
        ref={diagramRef}
        state={state}
        onAddCard={containerId => setEditTarget({ containerId, cardId: null })}
        onEditCard={(containerId, cardId) => setEditTarget({ containerId, cardId })}
      />

      <BottomRow
        ref={bottomWrapRef}
        state={state}
        onAddZone={() => setZoneModalOpen(true)}
        onAddCard={containerId => setEditTarget({ containerId, cardId: null })}
        onEditCard={(containerId, cardId) => setEditTarget({ containerId, cardId })}
      />

      <Legend ref={legendRef} />

      {editTarget && (
        <CardModal
          containerId={editTarget.containerId}
          card={editingCard}
          onClose={() => setEditTarget(null)}
          onSave={data => {
            state.saveCard(editTarget.containerId, editTarget.cardId, data)
            setEditTarget(null)
          }}
        />
      )}

      {layerModalOpen && (
        <LayerModal
          onClose={() => setLayerModalOpen(false)}
          onSave={(name, color) => {
            state.addLayer(name, color)
            setLayerModalOpen(false)
          }}
        />
      )}

      {zoneModalOpen && (
        <ZoneModal
          onClose={() => setZoneModalOpen(false)}
          onSave={(name, color) => {
            state.addZone(name, color)
            setZoneModalOpen(false)
          }}
        />
      )}

      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onGenerated={items => {
            state.mergeClassifiedItems(items)
            setUploadModalOpen(false)
          }}
        />
      )}
    </>
  )
}

export default App
