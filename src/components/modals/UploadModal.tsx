import { useRef, useState } from 'react'
import type { ClassifiedItem } from '../../types'
import { extractTextFromFile } from '../../utils/fileExtract'

interface UploadModalProps {
  onGenerated: (items: ClassifiedItem[]) => void
  onClose: () => void
}

type Mode = 'file' | 'paste'
type Phase = 'idle' | 'extracting' | 'classifying' | 'error'

export function UploadModal({ onGenerated, onClose }: UploadModalProps) {
  const [mode, setMode] = useState<Mode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const busy = phase === 'extracting' || phase === 'classifying'

  const pickFile = (f: File | null) => {
    setFile(f)
    setError('')
  }

  const run = async () => {
    setError('')
    try {
      let text = ''
      if (mode === 'file') {
        if (!file) { setError('Choose a file first.'); return }
        setPhase('extracting')
        text = await extractTextFromFile(file)
      } else {
        text = pastedText
      }
      if (!text.trim()) {
        setError('No text found to classify.')
        setPhase('idle')
        return
      }

      setPhase('classifying')
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `Classification failed (${res.status})`)
      }
      const items = (data.items ?? []) as ClassifiedItem[]
      if (items.length === 0) {
        setError('The model returned no classifiable items. Try adding more detail to the input.')
        setPhase('error')
        return
      }
      onGenerated(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setPhase('error')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="modal modal-wide">
        <h3>Auto-Generate Diagram from File</h3>

        <div className="upload-tabs">
          <button className={`upload-tab${mode === 'file' ? ' active' : ''}`} onClick={() => setMode('file')} disabled={busy}>
            Upload file
          </button>
          <button className={`upload-tab${mode === 'paste' ? ' active' : ''}`} onClick={() => setMode('paste')} disabled={busy}>
            Paste text
          </button>
        </div>

        {mode === 'file' ? (
          <div
            className={`upload-dropzone${dragActive ? ' drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => {
              e.preventDefault()
              setDragActive(false)
              const f = e.dataTransfer.files?.[0]
              if (f) pickFile(f)
            }}
          >
            Drop a .csv, .docx, .pdf, or .txt file here, or click to browse
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.docx,.pdf,.txt"
              style={{ display: 'none' }}
              onChange={e => pickFile(e.target.files?.[0] ?? null)}
            />
            {file && <div className="upload-filename">{file.name}</div>}
          </div>
        ) : (
          <>
            <label style={{ marginTop: 12 }}>Paste your services/systems list</label>
            <textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Paste a raw list — messy is fine, no template required"
              style={{ minHeight: 160 }}
            />
          </>
        )}

        {error && <div className="upload-error">{error}</div>}
        {phase === 'extracting' && <div className="upload-status">Extracting text…</div>}
        {phase === 'classifying' && <div className="upload-status">Classifying with Claude…</div>}

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-save" onClick={run} disabled={busy}>
            {busy ? 'Working…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}
