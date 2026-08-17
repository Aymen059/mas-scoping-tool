import { useRef, useState } from 'react'

export function useLayerDrag(reorderLayers: (sourceId: string, targetId: string) => void) {
  const dragSrc = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const dragHandlers = (layerId: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragSrc.current = layerId
      setDraggingId(layerId)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: () => {
      setDraggingId(null)
      setDragOverId(null)
      dragSrc.current = null
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragSrc.current && dragSrc.current !== layerId) {
        setDragOverId(layerId)
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (!dragSrc.current || dragSrc.current === layerId) return
      reorderLayers(dragSrc.current, layerId)
      setDragOverId(null)
    },
  })

  return { dragHandlers, dragOverId, draggingId }
}
