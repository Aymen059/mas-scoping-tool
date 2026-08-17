import { useState } from 'react'
import type { CardData, Status, Tag } from '../../types'

interface CardModalProps {
  containerId: string
  card: CardData | null
  onSave: (data: { name: string; desc: string; status: Status; tags: Tag[] }) => void
  onClose: () => void
}

const TAGS: { id: Tag; badge: string; badgeLabel: string; suffix: string }[] = [
  { id: 'gd', badge: 'b-gd', badgeLabel: 'GD', suffix: 'Gov data' },
  { id: 'md', badge: 'b-md', badgeLabel: 'MD', suffix: 'Metadata' },
  { id: 'auth', badge: 'b-auth', badgeLabel: 'FedRAMP AUTH', suffix: '' },
  { id: 'noauth', badge: 'b-noauth', badgeLabel: 'Not FedRAMP Auth', suffix: '' },
]

export function CardModal({ card, onSave, onClose }: CardModalProps) {
  const [name, setName] = useState(card?.name ?? '')
  const [desc, setDesc] = useState(card?.desc ?? '')
  const [status, setStatus] = useState<Status>(card?.status ?? 'in')
  const [tags, setTags] = useState<Tag[]>(card?.tags ?? [])

  const toggleTag = (t: Tag) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const save = () => {
    onSave({ name: name.trim() || 'New Component', desc: desc.trim(), status, tags })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3>{card ? 'Edit Component' : 'Add Component'}</h3>

        <label>Component name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Management" autoFocus />

        <label>Description</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe this component — include placeholder text and examples the next consultant should know about"
        />

        <label>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as Status)}>
          <option value="in">IN — In MAS boundary</option>
          <option value="pending">PENDING — Pending scoping decision</option>
          <option value="excluded">EXCLUDED — Excluded with rationale</option>
          <option value="optional">OPTIONAL — Include if relevant</option>
          <option value="out">OUT OF SCOPE</option>
        </select>

        <label>Extra tags</label>
        <div className="checkbox-row">
          {TAGS.map(t => (
            <label className="checkbox-label" key={t.id}>
              <input type="checkbox" checked={tags.includes(t.id)} onChange={() => toggleTag(t.id)} />
              <span className={`badge ${t.badge}`}>{t.badgeLabel}</span> {t.suffix}
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
