import html2canvas from 'html2canvas'
import type { MetaFields } from '../types'

const SKIP_CLASSES = [
  'resize-handle-right', 'resize-handle-bottom', 'resize-handle-corner',
  'layer-del-confirm', 'del-confirm', 'card-actions',
  'layer-header-actions', 'layer-color-btn', 'zone-header-actions',
]

function cloneForExport(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true)
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (tag === 'button') return null
  if (SKIP_CLASSES.some(c => el.classList?.contains(c))) return null

  if (tag === 'input' || tag === 'textarea') {
    const input = el as HTMLInputElement | HTMLTextAreaElement
    const span = document.createElement('span')
    span.textContent = input.value || el.textContent || ''
    const cs = window.getComputedStyle(el)
    span.style.cssText = `
      font-size:${cs.fontSize};
      font-weight:${cs.fontWeight};
      color:${cs.color};
      font-family:${cs.fontFamily};
      letter-spacing:${cs.letterSpacing};
      background:transparent;
      display:inline-block;
      white-space:normal;
      word-break:break-word;
      flex:1;
    `
    return span
  }

  const clone = el.cloneNode(false) as HTMLElement
  for (const child of Array.from(el.childNodes)) {
    const c = cloneForExport(child)
    if (c) clone.appendChild(c)
  }
  return clone
}

export async function exportPng(diagramEl: HTMLElement, bottomWrapEl: HTMLElement, legendEl: HTMLElement, meta: MetaFields) {
  const date = meta.date || new Date().toLocaleDateString()

  const exportArea = document.createElement('div')
  exportArea.style.cssText = 'background:#e8eaf0;padding:24px;font-family:Helvetica Neue,Arial,sans-serif;position:fixed;top:-99999px;left:0;'
  exportArea.style.width = Math.max(diagramEl.scrollWidth + 48, 1300) + 'px'

  const titleBar = document.createElement('div')
  titleBar.style.cssText = 'background:#0a1628;border-radius:10px;padding:14px 20px 14px 26px;margin-bottom:14px;border-left:7px solid #38bdf8;'
  titleBar.innerHTML =
    '<div style="font-size:17px;font-weight:700;color:white;margin-bottom:5px;letter-spacing:0.3px;">FedRAMP MAS Boundary Scoping Diagram</div>' +
    '<div style="font-size:10px;color:#7dd3fc;letter-spacing:0.3px;">' +
    (meta.consultant ? 'Consultant: ' + escapeHtml(meta.consultant) + '&nbsp;&nbsp;·&nbsp;&nbsp;' : '') +
    (meta.client ? 'Client: ' + escapeHtml(meta.client) + '&nbsp;&nbsp;·&nbsp;&nbsp;' : '') +
    (meta.date ? 'Date: ' + escapeHtml(meta.date) + '&nbsp;&nbsp;·&nbsp;&nbsp;' : '') +
    'REUSABLE TEMPLATE &nbsp;·&nbsp; v1.0' +
    '</div>'
  exportArea.appendChild(titleBar)

  const diagClone = cloneForExport(diagramEl)
  const wrapClone = cloneForExport(bottomWrapEl) as HTMLElement | null
  const legendClone = cloneForExport(legendEl) as HTMLElement | null
  if (diagClone) exportArea.appendChild(diagClone)
  if (wrapClone) {
    wrapClone.style.marginTop = '12px'
    exportArea.appendChild(wrapClone)
  }
  if (legendClone) {
    legendClone.style.marginTop = '12px'
    exportArea.appendChild(legendClone)
  }

  document.body.appendChild(exportArea)

  try {
    const canvas = await html2canvas(exportArea, {
      scale: 4,
      backgroundColor: '#e8eaf0',
      useCORS: true,
      logging: false,
      width: exportArea.scrollWidth,
      height: exportArea.scrollHeight,
      windowWidth: exportArea.scrollWidth,
      windowHeight: exportArea.scrollHeight,
    })
    const a = document.createElement('a')
    a.download = 'MAS_Scoping_' + (meta.client || 'Client') + '_' + date.replace(/\//g, '-') + '.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  } finally {
    document.body.removeChild(exportArea)
  }
}

function escapeHtml(s: string) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
