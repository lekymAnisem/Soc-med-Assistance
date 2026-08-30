/**
 * Procedurally generated abstract artwork — original, on-the-fly.
 * No external assets, no placeholder downloads. Produces a canvas
 * with a dark gradient field, flowing noise shapes and signal accents.
 */
let cache = new Map()

export function createArtwork(seed = 1, w = 640, h = 800) {
  const key = `${seed}-${w}-${h}`
  if (cache.has(key)) return cache.get(key)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const rnd = mulberry32(seed)

  // base vertical gradient
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#0a0b10')
  g.addColorStop(0.5, '#0e0f14')
  g.addColorStop(1, '#050506')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // flowing noise blobs
  for (let i = 0; i < 14; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const r = (40 + rnd() * 140) * (0.6 + rnd())
    const hue = rnd() > 0.5 ? 240 + rnd() * 30 : 80
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.4 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, ${40 + rnd() * 30}%, ${12 + rnd() * 16}%, ${0.12 + rnd() * 0.2})`
    ctx.fill()
  }

  // structure lines
  ctx.strokeStyle = 'rgba(216,255,62,0.10)'
  ctx.lineWidth = 1
  for (let i = 0; i < 40; i++) {
    ctx.beginPath()
    const x = rnd() * w
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (rnd() - 0.5) * 60, h)
    ctx.stroke()
  }

  // central luminous form
  const cx = w * (0.35 + rnd() * 0.3)
  const cy = h * (0.3 + rnd() * 0.4)
  const coreR = 60 + rnd() * 80
  const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.4)
  radial.addColorStop(0, 'rgba(216,255,62,0.28)')
  radial.addColorStop(0.4, 'rgba(143,174,255,0.14)')
  radial.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = radial
  ctx.fillRect(0, 0, w, h)

  // wireframe-ish rings around the form
  ctx.strokeStyle = 'rgba(143,174,255,0.25)'
  ctx.lineWidth = 1
  for (let k = 0; k < 3; k++) {
    ctx.beginPath()
    ctx.ellipse(cx, cy, coreR * (1 + k * 0.7), coreR * (0.5 + k * 0.4), rnd() * 0.8, 0, Math.PI * 2)
    ctx.stroke()
  }

  // grain
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (rnd() - 0.5) * 22
    data[i] += n
    data[i + 1] += n
    data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)

  const url = canvas.toDataURL('image/jpeg', 0.82)
  cache.set(key, url)
  return url
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
