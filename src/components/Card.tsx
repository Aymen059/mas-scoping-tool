import { useRef, useState } from 'react'
import type { CardData } from '../types'
import { S_BADGE, S_LABEL, T_BADGE, T_LABEL } from '../constants'
import { useCardResize } from '../hooks/useCardResize'

interface CardProps {
  card: CardData
  containerId: string
  titleColor?: string
  headerBg?: string
  onUpdateField: (field: 'name' | 'desc' | 'eg', value: string) => void
  onCycleStatus: () => void
  onEdit: () => void
  onDelete: () => void
}

export function Card({ card, titleColor = '#1e293b', headerBg = '#f8fafc', onUpdateField, onCycleStatus, onEdit, onDelete }: CardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { startResize } = useCardResize(cardRef)

  return (
    <div className={`card status-${card.status}`} ref={cardRef} data-card-id={card.id}>
      {confirmingDelete && (
        <div className="del-confirm show">
          <span>Delete?</span>
          <button className="cy" onClick={onDelete}>Yes</button>
          <button className="cn" onClick={() => setConfirmingDelete(false)}>No</button>
        </div>
      )}

      <div className="card-top" style={{ background: headerBg }}>
        <div
          className="card-title"
          contentEditable
          suppressContentEditableWarning
          style={{ color: titleColor }}
          onBlur={e => onUpdateField('name', e.currentTarget.textContent?.trim() ?? '')}
        >
          {card.name}
        </div>
        <div className="card-actions">
          <button className="card-action-btn" onClick={onEdit}>✏</button>
          <button className="card-action-btn" onClick={() => setConfirmingDelete(true)}>✕</button>
        </div>
      </div>

      <div className="card-body-inner">
        <div
          className="card-desc"
          contentEditable
          suppressContentEditableWarning
          onBlur={e => onUpdateField('desc', e.currentTarget.textContent?.trim() ?? '')}
        >
          {card.desc}
        </div>
        <div
          className="card-eg"
          contentEditable
          suppressContentEditableWarning
          onBlur={e => onUpdateField('eg', e.currentTarget.textContent?.trim() ?? '')}
        >
          {card.eg}
        </div>
      </div>

      <div className="card-footer">
        <span className={`badge status-tag ${S_BADGE[card.status]}`} title="Click to cycle" onClick={onCycleStatus}>
          {S_LABEL[card.status]}
        </span>
        {(card.tags ?? []).map(t => (
          <span key={t} className={`badge ${T_BADGE[t]}`}>{T_LABEL[t]}</span>
        ))}
      </div>

      <div className="resize-handle-right" title="Drag to resize width" onMouseDown={startResize('right')} />
      <div className="resize-handle-bottom" title="Drag to resize height" onMouseDown={startResize('bottom')} />
      <div className="resize-handle-corner" title="Drag to resize both" onMouseDown={startResize('corner')} />
    </div>
  )
}
