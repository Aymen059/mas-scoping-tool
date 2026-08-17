import { forwardRef } from 'react'
import type { DiagramState } from '../state/useDiagramState'
import { Layer } from './Layer'
import { useLayerDrag } from '../hooks/useLayerDrag'

interface DiagramProps {
  state: DiagramState
  onAddCard: (containerId: string) => void
  onEditCard: (containerId: string, cardId: string) => void
}

export const Diagram = forwardRef<HTMLDivElement, DiagramProps>(({ state, onAddCard, onEditCard }, ref) => {
  const { dragHandlers, dragOverId, draggingId } = useLayerDrag(state.reorderLayers)

  return (
    <div className="diagram" id="diagram" ref={ref}>
      {state.layers.map(layer => (
        <Layer
          key={layer.id}
          layer={layer}
          state={state}
          dragHandlers={dragHandlers(layer.id)}
          isDragging={draggingId === layer.id}
          isDragOver={dragOverId === layer.id}
          onAddCard={() => onAddCard(layer.id)}
          onEditCard={cardId => onEditCard(layer.id, cardId)}
        />
      ))}
    </div>
  )
})
Diagram.displayName = 'Diagram'
