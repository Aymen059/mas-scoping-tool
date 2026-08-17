type Axis = 'right' | 'bottom' | 'corner'

const MIN_WIDTH = 140
const MIN_HEIGHT = 100

/** Drag-resizes the card element directly via inline styles. Setting an explicit flex-basis
 * (flex-grow/shrink: 0) opts the card out of the row's proportional sizing, which is how a
 * manual resize overrides the default responsive layout. */
export function useCardResize(cardRef: React.RefObject<HTMLDivElement | null>) {
  const startResize = (axis: Axis) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = cardRef.current
    if (!el) return

    const startX = e.clientX
    const startY = e.clientY
    const rect = el.getBoundingClientRect()
    const startW = rect.width
    const startH = rect.height
    const handle = e.currentTarget as HTMLElement
    handle.classList.add('resizing')

    const onMove = (ev: MouseEvent) => {
      if (axis === 'right' || axis === 'corner') {
        const newW = Math.max(MIN_WIDTH, startW + (ev.clientX - startX))
        el.style.flex = `0 0 ${newW}px`
        el.style.minWidth = newW + 'px'
        el.style.maxWidth = newW + 'px'
      }
      if (axis === 'bottom' || axis === 'corner') {
        const newH = Math.max(MIN_HEIGHT, startH + (ev.clientY - startY))
        el.style.height = newH + 'px'
        el.style.minHeight = newH + 'px'
      }
    }
    const onUp = () => {
      handle.classList.remove('resizing')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return { startResize }
}
