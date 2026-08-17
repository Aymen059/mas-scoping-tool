import { useState } from 'react'
import { ColorPresets } from './ColorPresets'

interface LayerModalProps {
  onSave: (name: string, color: string) => void
  onClose: () => void
}

export function LayerModal({ onSave, onClose }: LayerModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f46e5')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3>Add New Layer</h3>
        <label>Layer name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Custom Security Layer" autoFocus />

        <label>Choose color</label>
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
          <button className="btn btn-save" onClick={() => onSave(name.trim() || 'New Layer', color)}>Add Layer</button>
        </div>
      </div>
    </div>
  )
}
