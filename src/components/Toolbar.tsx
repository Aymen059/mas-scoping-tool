import type { MetaFields } from '../types'

interface ToolbarProps {
  meta: MetaFields
  onMetaChange: (meta: MetaFields) => void
  onAddLayer: () => void
  onReset: () => void
  onExportPng: () => void
  onExportJson: () => void
  onExportSvg: () => void
  onUpload: () => void
  exporting: boolean
}

export function Toolbar({ meta, onMetaChange, onAddLayer, onReset, onExportPng, onExportJson, onExportSvg, onUpload, exporting }: ToolbarProps) {
  const field = (key: keyof MetaFields) => ({
    value: meta[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onMetaChange({ ...meta, [key]: e.target.value }),
  })

  return (
    <div className="toolbar">
      <div className="toolbar-title">
        FedRAMP MAS Boundary Scoping Diagram
        <span>REUSABLE TEMPLATE · v1.0</span>
      </div>
      <div className="meta-fields">
        <div className="meta-field">Consultant <input type="text" placeholder="Your name" {...field('consultant')} /></div>
        <div className="meta-field">Client <input type="text" placeholder="Client name" {...field('client')} /></div>
        <div className="meta-field">Date <input type="text" placeholder="MM/DD/YYYY" {...field('date')} /></div>
      </div>
      <button className="btn btn-upload" onClick={onUpload}>⇪ Auto-Generate</button>
      <button className="btn btn-addlayer" onClick={onAddLayer}>+ Add Layer</button>
      <button className="btn btn-reset" onClick={onReset}>Reset</button>
      <button className="btn btn-export" onClick={onExportPng} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export PNG'}
      </button>
      <button className="btn btn-export" onClick={onExportJson} disabled={exporting}>Export JSON</button>
      <button className="btn btn-export" onClick={onExportSvg} disabled={exporting}>Export SVG</button>
    </div>
  )
}
