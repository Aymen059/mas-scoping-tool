import type { ServiceData } from '../types'
import { SVC_DOT, SVC_TIP } from '../constants'

interface ServicesCardProps {
  layerId: string
  services: ServiceData[]
  titleColor: string
  headerBg: string
  autoFocusId?: string | null
  onAddService: () => void
  onUpdateServiceName: (svcId: string, name: string) => void
  onCycleServiceStatus: (svcId: string) => void
  onDeleteService: (svcId: string) => void
}

export function ServicesCard({
  services, titleColor, headerBg, autoFocusId,
  onAddService, onUpdateServiceName, onCycleServiceStatus, onDeleteService,
}: ServicesCardProps) {
  return (
    <div className="services-card">
      <div className="services-card-top" style={{ background: headerBg }}>
        <span className="services-card-title" style={{ color: titleColor }}>Leveraged Cloud Services</span>
        <span className="services-card-hint">Click dot to cycle FedRAMP status · Click ✕ to remove</span>
      </div>

      <div className="chips-area">
        {services.map(svc => (
          <div className="chip" key={svc.id} data-service-id={svc.id}>
            <div
              className={`chip-dot ${SVC_DOT[svc.status]}`}
              title={`${SVC_TIP[svc.status]} · Click to cycle`}
              onClick={() => onCycleServiceStatus(svc.id)}
            />
            <div
              className="chip-name"
              contentEditable
              suppressContentEditableWarning
              ref={el => { if (el && svc.id === autoFocusId) el.focus() }}
              onBlur={e => onUpdateServiceName(svc.id, e.currentTarget.textContent?.trim() ?? '')}
            >
              {svc.name}
            </div>
            <button className="chip-del" onClick={() => onDeleteService(svc.id)}>✕</button>
          </div>
        ))}
        <button className="add-chip-btn" onClick={onAddService}>+ Add service</button>
      </div>

      <div className="services-legend">
        <div className="sleg"><div className="sleg-dot" style={{ background: '#16a34a' }} />FedRAMP Auth</div>
        <div className="sleg"><div className="sleg-dot" style={{ background: '#ef4444' }} />Not Auth</div>
        <div className="sleg"><div className="sleg-dot" style={{ background: '#f97316' }} />Pending</div>
        <div className="sleg"><div className="sleg-dot" style={{ background: '#94a3b8' }} />Out of scope</div>
      </div>
    </div>
  )
}
