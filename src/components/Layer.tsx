import { useState } from 'react'
import type { LayerData } from '../types'
import { lighten, darken } from '../utils/color'
import { Card } from './Card'
import { ServicesCard } from './ServicesCard'
import type { DiagramState } from '../state/useDiagramState'

interface LayerProps {
  layer: LayerData
  state: DiagramState
  dragHandlers: React.HTMLAttributes<HTMLDivElement>
  isDragging: boolean
  isDragOver: boolean
  onAddCard: () => void
  onEditCard: (cardId: string) => void
}

export function Layer({ layer, state, dragHandlers, isDragging, isDragOver, onAddCard, onEditCard }: LayerProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [newServiceId, setNewServiceId] = useState<string | null>(null)

  const bg = lighten(layer.color, 0.9)
  const titleColor = darken(layer.color, 0.1)
  const cardHeaderBg = lighten(layer.color, 0.85)

  const classes = ['layer']
  if (isDragging) classes.push('dragging')
  if (isDragOver) classes.push('drag-over')

  return (
    <div
      className={classes.join(' ')}
      style={{ background: bg, border: `1.5px solid ${layer.color}` }}
      data-layer-id={layer.id}
      {...dragHandlers}
    >
      {confirmingDelete && (
        <div className="layer-del-confirm show">
          <p>Delete entire layer "<b>{layer.name}</b>"?</p>
          <div className="ldc-btns">
            <button className="ldc-yes" onClick={() => state.deleteLayer(layer.id)}>Yes, delete</button>
            <button className="ldc-no" onClick={() => setConfirmingDelete(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="layer-header" style={{ background: layer.color }}>
        <span className="drag-handle" title="Drag to reorder">⠿</span>
        <input
          type="text"
          className="layer-name"
          defaultValue={layer.name}
          onMouseDown={e => e.stopPropagation()}
          onBlur={e => state.renameLayer(layer.id, e.target.value)}
        />
        <div className="layer-header-actions">
          <div className="layer-color-btn" style={{ background: layer.color }} title="Change color" onMouseDown={e => e.stopPropagation()}>
            <input
              type="color"
              value={layer.color}
              onChange={e => state.setLayerColor(layer.id, e.target.value)}
            />
          </div>
          <button className="layer-btn" onMouseDown={e => e.stopPropagation()} onClick={onAddCard}>+ Add Component</button>
          <button className="layer-btn del-layer" onMouseDown={e => e.stopPropagation()} onClick={() => setConfirmingDelete(true)}>✕ Remove Layer</button>
        </div>
      </div>

      <div className="cards-row">
        {layer.cards.map(card => (
          <Card
            key={card.id}
            card={card}
            containerId={layer.id}
            titleColor={titleColor}
            headerBg={cardHeaderBg}
            onUpdateField={(field, value) => state.updateCardField(layer.id, card.id, field, value)}
            onCycleStatus={() => state.cycleStatus(layer.id, card.id)}
            onEdit={() => onEditCard(card.id)}
            onDelete={() => state.deleteCard(layer.id, card.id)}
          />
        ))}
        {layer.services && (
          <ServicesCard
            layerId={layer.id}
            services={layer.services}
            titleColor={titleColor}
            headerBg={cardHeaderBg}
            autoFocusId={newServiceId}
            onAddService={() => setNewServiceId(state.addService(layer.id))}
            onUpdateServiceName={(svcId, name) => state.updateServiceName(layer.id, svcId, name)}
            onCycleServiceStatus={svcId => state.cycleServiceStatus(layer.id, svcId)}
            onDeleteService={svcId => state.deleteService(layer.id, svcId)}
          />
        )}
      </div>
    </div>
  )
}
