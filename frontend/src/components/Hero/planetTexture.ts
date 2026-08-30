/**
 * Generates a realistic planet texture on a canvas using simplex noise.
 * No external images — everything is procedural.
 */
import { createSimplexNoise } from '../AIVisualLab/simplexNoise'

const noise = createSimplexNoise(42)
const noise2 = createSimplexNoise(137)

/**
 * Returns a 1024×512 data URL for an equirectangular planet texture.
 * Blue ocean, green/brown landmasses, white cloud wisps, polar ice caps.
 */
export function generatePlanetTexture(): string {
  const W = 1024, H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(W, H)
  const data = img.data

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W
      const v = y / H
      const lon = u * Math.PI * 2
      const lat = v * Math.PI

      // 3D position on unit sphere for seamless noise
      const px = Math.sin(lat) * Math.cos(lon)
      const py = Math.sin(lat) * Math.sin(lon)
      const pz = Math.cos(lat)

      // continent mask: layered noise
      const n1 = noise.noise3(px * 2.2, py * 2.2, pz * 2.2)
      const n2 = noise.noise3(px * 4.5, py * 4.5, pz * 4.5) * 0.5
      const n3 = noise.noise3(px * 8, py * 8, pz * 8) * 0.25
      const elevation = n1 + n2 + n3

      // cloud layer
      const c1 = noise2.noise3(px * 3.5, py * 3.5, pz * 3.5)
      const c2 = noise2.noise3(px * 7, py * 7, pz * 7) * 0.5
      const cloud = c1 + c2

      // ice caps
      const latFactor = Math.abs(v - 0.5) * 2
      const ice = Math.max(0, 1 - latFactor * 3.5) * (0.5 + elevation * 0.5)

      let r, g, b

      if (elevation < -0.15) {
        // deep ocean
        const t = (elevation + 0.6) / 0.45
        r = 10 + t * 20
        g = 30 + t * 40
        b = 80 + t * 60
      } else if (elevation < 0.0) {
        // shallow / coastal
        const t = (elevation + 0.15) / 0.15
        r = 30 + t * 40
        g = 70 + t * 50
        b = 140 - t * 30
      } else if (elevation < 0.25) {
        // lowland / green
        const t = elevation / 0.25
        r = 70 + t * 50
        g = 120 + t * 40
        b = 110 - t * 40
      } else if (elevation < 0.5) {
        // highland / brown
        const t = (elevation - 0.25) / 0.25
        r = 120 + t * 40
        g = 160 - t * 20
        b = 70 - t * 20
      } else {
        // mountain / snow
        const t = Math.min(1, (elevation - 0.5) / 0.3)
        r = 160 + t * 95
        g = 140 + t * 115
        b = 50 + t * 205
      }

      // cloud overlay
      const cloudAlpha = Math.max(0, cloud * 0.3)
      r += cloudAlpha * 50
      g += cloudAlpha * 50
      b += cloudAlpha * 50

      // ice caps
      r += ice * 60
      g += ice * 70
      b += ice * 100

      const i = (y * W + x) * 4
      data[i] = Math.min(255, Math.max(0, r))
      data[i + 1] = Math.min(255, Math.max(0, g))
      data[i + 2] = Math.min(255, Math.max(0, b))
      data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Generates a 256×128 cloud normal / bump map for subtle surface detail.
 */
export function generateCloudMap(): string {
  const W = 256, H = 128
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(W, H)
  const data = img.data

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H
      const lon = u * Math.PI * 2, lat = v * Math.PI
      const px = Math.sin(lat) * Math.cos(lon)
      const py = Math.sin(lat) * Math.sin(lon)
      const pz = Math.cos(lat)
      const n = noise2.noise3(px * 5, py * 5, pz * 5)
      const val = Math.max(0, Math.min(255, (n + 0.6) * 180))
      const i = (y * W + x) * 4
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
      data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.8)
}