import { useState } from 'react'
import { ColorPresets } from './ColorPresets'

interface ZoneModalProps {
  onSave: (name: string, color: string) => void
  onClose: () => void
}

export function ZoneModal({ onSave, onClose }: ZoneModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0277bd')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3>Add Zone</h3>
        <label>Zone name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Partner Environment" autoFocus />

        <label>Zone type / color</label>
        <ColorPresets value={color} onChange={setColor} />

        <label style={{ marginTop: 10 }}>Or pick custom</label>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          style={{ width: 52, height: 30, border: 'none', cursor: 'pointer', borderRadius: 6, marginTop: 4 }}
        />

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={() => onSave(name.trim() || 'New Zone', color)}>Add Zone</button>
        </div>
      </div>
    </div>
  )
}
