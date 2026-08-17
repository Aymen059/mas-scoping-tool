import { forwardRef } from 'react'

export const Legend = forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <div className="legend" ref={ref}>
      <div className="legend-title">LEGEND</div>
      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-box" style={{ background: 'white', border: '2px solid #ef4444', color: '#ef4444' }}>IN</div>
          In MAS boundary
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: 'white', border: '2px dashed #f97316', color: '#f97316', fontSize: '6.5px' }}>PENDING</div>
          Pending decision
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#f8fafc', border: '1.5px dashed #94a3b8', color: '#94a3b8', fontSize: '6.5px' }}>EXCLUDED</div>
          Excluded
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ background: '#f8fafc', border: '1.5px dashed #94a3b8', color: '#94a3b8', fontSize: '6.5px' }}>OPTIONAL</div>
          If relevant
        </div>
        <div className="legend-item"><span className="badge b-gd">GD</span>Gov data present</div>
        <div className="legend-item"><span className="badge b-md">MD</span>Metadata / telemetry</div>
        <div className="legend-item"><span className="badge b-auth">FedRAMP AUTH</span>FedRAMP authorized</div>
        <div className="legend-item"><span className="badge b-noauth">Not FedRAMP Auth</span>Not authorized</div>
        <div className="legend-item" style={{ gap: 4 }}>
          <span className="legend-dots">
            <span className="legend-dot" style={{ background: '#16a34a' }} />Auth
            <span className="legend-dot" style={{ background: '#ef4444' }} />Not Auth
            <span className="legend-dot" style={{ background: '#f97316' }} />Pending
            <span className="legend-dot" style={{ background: '#94a3b8' }} />Out
            &nbsp;← Service chip dots
          </span>
        </div>
      </div>
      <div className="legend-note">
        <b>Cards:</b> Click any text to edit inline · Click status badge to cycle statuses · Click ✏ for full edit · Hover card → click ✕ to delete<br />
        <b>Layers:</b> Drag ⠿ to reorder · Click layer name to rename · Click ● to change color · "✕ Remove Layer" deletes entire layer<br />
        <b>Services:</b> Click dot on service chip to cycle FedRAMP status (green=Auth · red=Not Auth · orange=Pending · gray=Out) · Click ✕ on chip to remove<br />
        <b>Zones:</b> Use "+ Add Zone" to restore deleted zones or create new ones · GD = gov data present · MD = metadata/telemetry only
      </div>
    </div>
  )
})
Legend.displayName = 'Legend'
