export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

export function lighten(hex: string, a = 0.91) {
  const { r, g, b } = hexToRgb(hex)
  const m = (c: number) => Math.round(c + (255 - c) * a)
  return `rgb(${m(r)},${m(g)},${m(b)})`
}

export function darken(hex: string, a = 0.15) {
  const { r, g, b } = hexToRgb(hex)
  const m = (c: number) => Math.round(c * (1 - a))
  return `rgb(${m(r)},${m(g)},${m(b)})`
}
