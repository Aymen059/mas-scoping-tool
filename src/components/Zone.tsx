import type { ZoneData } from '../types'
import { Card } from './Card'
import type { DiagramState } from '../state/useDiagramState'

interface ZoneProps {
  zone: ZoneData
  state: DiagramState
  /** Narrow fixed-width column (used for the Customer zone, alone on the left).
   * Omitted/false zones stretch to fill their container (the right column). */
  fixedWidth?: boolean
  onAddCard: () => void
  onEditCard: (cardId: string) => void
}

export function Zone({ zone, state, fixedWidth = false, onAddCard, onEditCard }: ZoneProps) {
  const flexStyle = fixedWidth ? { flex: `0 0 ${zone.fixedWidth || '340px'}` } : undefined

  return (
    <div
      className="zone"
      style={{
        background: zone.bgColor,
        border: `${zone.borderDash ? '2px dashed' : '1.5px solid'} ${zone.borderColor}`,
        ...flexStyle,
      }}
      data-zone-id={zone.id}
    >
      <div className="zone-header" style={{ background: zone.color }}>
        <input
          type="text"
          className="zone-name-input"
          defaultValue={zone.name}
          onBlur={e => state.renameZone(zone.id, e.target.value)}
        />
        <div className="zone-header-actions">
          <button className="layer-btn" onClick={onAddCard}>+ Add</button>
          <button
            className="layer-btn del-layer"
            onClick={() => {
              if (window.confirm(`Remove the "${zone.name}" zone?`)) state.deleteZone(zone.id)
            }}
          >
            ✕ Remove
          </button>
        </div>
      </div>

      <div className="zone-cards">
        {zone.cards.map(card => (
          <Card
            key={card.id}
            card={card}
            containerId={zone.id}
            titleColor={zone.titleColor}
            headerBg={zone.headerColor}
            onUpdateField={(field, value) => state.updateCardField(zone.id, card.id, field, value)}
            onCycleStatus={() => state.cycleStatus(zone.id, card.id)}
            onEdit={() => onEditCard(card.id)}
            onDelete={() => state.deleteCard(zone.id, card.id)}
          />
        ))}
      </div>
    </div>
  )
}
