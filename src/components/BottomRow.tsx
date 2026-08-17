import { forwardRef } from 'react'
import type { DiagramState } from '../state/useDiagramState'
import { Zone } from './Zone'

interface BottomRowProps {
  state: DiagramState
  onAddZone: () => void
  onAddCard: (containerId: string) => void
  onEditCard: (containerId: string, cardId: string) => void
}

export const BottomRow = forwardRef<HTMLDivElement, BottomRowProps>(({ state, onAddZone, onAddCard, onEditCard }, ref) => {
  // Customer sits alone in a narrow left column; every other zone (Scoping Gaps, Corporate,
  // and any user-added zones) stacks in a fluid right column so their cards can wrap into a grid.
  const customerZone = state.zones.find(z => z.id === 'customer')
  const rightColumnZones = state.zones.filter(z => z.id !== 'customer')

  const renderZone = (zone: typeof state.zones[number], fixedWidth: boolean) => (
    <Zone
      key={zone.id}
      zone={zone}
      state={state}
      fixedWidth={fixedWidth}
      onAddCard={() => onAddCard(zone.id)}
      onEditCard={cardId => onEditCard(zone.id, cardId)}
    />
  )

  return (
    <div className="bottom-row-wrap" ref={ref}>
      <div className="bottom-row-header">
        <span className="bottom-row-label">EXTERNAL ZONES (Outside Authorization Boundary)</span>
        <button className="btn btn-addzone" onClick={onAddZone}>+ Add Zone</button>
      </div>
      <div className="bottom-row">
        {customerZone && renderZone(customerZone, true)}
        <div className="zone-right-column">
          {rightColumnZones.map(zone => renderZone(zone, false))}
        </div>
      </div>
    </div>
  )
})
BottomRow.displayName = 'BottomRow'
