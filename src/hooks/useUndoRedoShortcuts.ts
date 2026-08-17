import { useEffect } from 'react'

function isEditableTarget(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
}

/** Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z to redo — skipped while an input/contentEditable is
 * focused so native text-field undo isn't hijacked. */
export function useUndoRedoShortcuts(undo: () => void, redo: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'z' || !(e.metaKey || e.ctrlKey)) return
      if (isEditableTarget(document.activeElement)) return
      e.preventDefault()
      if (e.shiftKey) redo(); else undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])
}
