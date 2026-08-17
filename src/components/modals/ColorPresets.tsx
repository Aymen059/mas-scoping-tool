import { PRESETS } from '../../constants'

interface ColorPresetsProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPresets({ value, onChange }: ColorPresetsProps) {
  return (
    <div className="color-presets">
      {PRESETS.map(color => (
        <div
          key={color}
          className={`color-preset${value === color ? ' selected' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
