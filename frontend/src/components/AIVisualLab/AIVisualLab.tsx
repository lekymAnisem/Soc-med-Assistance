import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, Shuffle, Download, Sparkles, Wand2 } from 'lucide-react'
import { createSimplexNoise, hashSeed, type SimplexNoise3D } from './simplexNoise'

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Vec2 = { x: number; y: number }

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  hue: number
  life: number
}

interface Settings {
  speed: number
  density: number
  turbulence: number
  hueShift: number
  saturation: number
  seed: number
}

interface Palette {
  name: string
  background: string
  /** [hue, saturation, lightness] base + secondary accent */
  baseHue: number
  saturation: number
  lightness: number
  accentHue: number
}

const RESOLUTIONS = [
  { id: 'linkedin', label: 'LinkedIn Banner', w: 1584, h: 396 },
  { id: 'youtube', label: 'YouTube', w: 1920, h: 1080 },
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'story', label: 'Story / Shorts', w: 1080, h: 1920 },
] as const

const PRESETS: Palette[] = [
  { name: 'Minimalist Light', background: '#f2f2ec', baseHue: 210, saturation: 22, lightness: 60, accentHue: 160 },
  { name: 'Dark Cyber', background: '#05060a', baseHue: 200, saturation: 85, lightness: 60, accentHue: 320 },
  { name: 'Neon Gradient', background: '#07040d', baseHue: 320, saturation: 95, lightness: 60, accentHue: 140 },
  { name: 'Organic Flow', background: '#04100a', baseHue: 145, saturation: 70, lightness: 55, accentHue: 45 },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AIVisualLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [palette, setPalette] = useState<Palette>(PRESETS[1])
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]['id']>('square')
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const settings = useRef<Settings>({ speed: 1, density: 1200, turbulence: 1.5, hueShift: 0, saturation: 85, seed: 1337 })
  const particles = useRef<Particle[]>([])
  const noise = useRef<SimplexNoise3D>(createSimplexNoise(settings.current.seed))
  const targetNoise = useRef<SimplexNoise3D>(noise.current)
  const blend = useRef(1)
  const size = useRef({ w: 0, h: 0, dpr: 1 })
  const playingRef = useRef(true)
  const rafRef = useRef(0)

  /* ---------- resize ---------- */
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      size.current = { w: canvas.width, h: canvas.height, dpr }
      seedParticles()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    // re-measure after layout settles (double rAF) in case the first read
    // happened before the grid resolved to its final size
    let raf = 0
    const settle = () => {
      raf = requestAnimationFrame(() => requestAnimationFrame(() => resize()))
    }
    settle()
    const onWinResize = () => resize()
    window.addEventListener('resize', onWinResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onWinResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  /* ---------- particle lifecycle ---------- */
  const seedParticles = useCallback(() => {
    const { w, h } = size.current
    const count = settings.current.density
    const arr: Particle[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        hue: Math.random(),
        life: 0,
      })
    }
    particles.current = arr
  }, [])

  useEffect(() => {
    seedParticles()
  }, [seedParticles])

  /* ---------- animation loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let last = performance.now()

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!playingRef.current) {
        rafRef.current = requestAnimationFrame(step)
        return
      }

      const { w, h } = size.current
      const s = settings.current
      const trailAlpha = palette.background === '#f2f2ec' ? 0.12 : 0.22

      // translucent wash for motion trails
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = hexToRgba(palette.background, trailAlpha)
      ctx.fillRect(0, 0, w, h)

      // animate seed morph (smooth transition between noise fields)
      if (blend.current < 1) {
        blend.current = Math.min(1, blend.current + dt * 1.2)
      }

      const freq = 0.0016 * s.turbulence
      const flow = s.speed * 0.00012
      const t = now * flow

      ctx.globalCompositeOperation = 'lighter'

      const arr = particles.current
      const n = arr.length
      for (let i = 0; i < n; i++) {
        const p = arr[i]
        const nx = p.x * freq
        const ny = p.y * freq

        let a = noise.current.noise3(nx, ny, t)
        if (blend.current < 1) {
          a = lerp(a, targetNoise.current.noise3(nx, ny, t), blend.current)
        }
        const angle = a * Math.PI * 3

        const targetX = Math.cos(angle)
        const targetY = Math.sin(angle)
        p.vx = lerp(p.vx, targetX, 0.045)
        p.vy = lerp(p.vy, targetY, 0.045)

        p.x += p.vx * 1.4
        p.y += p.vy * 1.4
        p.life += dt

        // wrap around edges
        if (p.x < -4) p.x = w + 4
        if (p.x > w + 4) p.x = -4
        if (p.y < -4) p.y = h + 4
        if (p.y > h + 4) p.y = -4

        const hue = lerp(palette.baseHue, palette.accentHue, p.hue) + s.hueShift
        const alpha = 0.4 + 0.5 * Math.abs(Math.sin(p.life * 0.8 + p.hue * 6))

        ctx.fillStyle = hsl(hue, s.saturation, palette.lightness, alpha * 0.5)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.1 + p.hue * 1.4, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [palette])

  /* ---------- controls ---------- */
  const togglePlay = () => {
    setPlaying((v) => {
      playingRef.current = !v
      return !v
    })
  }

  const updateSetting = (key: keyof Settings, value: number) => {
    settings.current[key] = value
    if (key === 'density') {
      const count = Math.max(100, value)
      // rebuild particles, keeping existing ones where possible
      const arr = particles.current
      if (arr.length > count) arr.length = count
      else {
        const { w, h } = size.current
        for (let i = arr.length; i < count; i++) {
          arr.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            hue: Math.random(),
            life: 0,
          })
        }
      }
    }
  }

  const applyPreset = (p: Palette) => {
    setPalette(p)
    settings.current.saturation = p.saturation
  }

  const synthesize = () => {
    const seed = hashSeed(prompt.trim() || 'nova')
    randomizeTo(seed)
  }

  const randomize = () => {
    randomizeTo(Math.floor(Math.random() * 0xffffffff))
  }

  const randomizeTo = (seed: number) => {
    noise.current = createSimplexNoise(seed)
    targetNoise.current = createSimplexNoise((seed * 9301 + 49297) % 0xffffffff)
    blend.current = 0
    settings.current.seed = seed
  }

  /* ---------- export ---------- */
  const exportSnapshot = async () => {
    setExporting(true)
    setExported(false)
    await new Promise((r) => setTimeout(r, 50))

    const res = RESOLUTIONS.find((r) => r.id === resolution)!
    const out = document.createElement('canvas')
    out.width = res.w
    out.height = res.h
    const ctx = out.getContext('2d')
    if (!ctx) {
      setExporting(false)
      return
    }

    const s = settings.current
    const freq = 0.0016 * s.turbulence
    const flow = s.speed * 0.00012
    const count = Math.min(s.density * 1.2, 2000)

    // static background
    ctx.fillStyle = palette.background
    ctx.fillRect(0, 0, res.w, res.h)

    // deterministic particle distribution from the seed
    let rng = mulberry(s.seed)
    const pos: Particle[] = []
    for (let i = 0; i < count; i++) {
      pos.push({
        x: rng() * res.w,
        y: rng() * res.h,
        vx: (rng() - 0.5) * 2,
        vy: (rng() - 0.5) * 2,
        hue: rng(),
        life: 0,
      })
    }

    const noiseField = createSimplexNoise(s.seed)
    const frames = 220
    for (let f = 0; f < frames; f++) {
      // translucent wash builds the trails
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = hexToRgba(palette.background, 0.18)
      ctx.fillRect(0, 0, res.w, res.h)

      ctx.globalCompositeOperation = 'lighter'
      const t = f * 16 * s.speed * 0.00012
      for (let i = 0; i < pos.length; i++) {
        const p = pos[i]
        const angle = noiseField.noise3(p.x * freq, p.y * freq, t) * Math.PI * 3
        const tx = Math.cos(angle)
        const ty = Math.sin(angle)
        p.vx = lerp(p.vx, tx, 0.045)
        p.vy = lerp(p.vy, ty, 0.045)
        p.x += p.vx * 1.4
        p.y += p.vy * 1.4
        if (p.x < -4) p.x = res.w + 4
        if (p.x > res.w + 4) p.x = -4
        if (p.y < -4) p.y = res.h + 4
        if (p.y > res.h + 4) p.y = -4

        const hue = lerp(palette.baseHue, palette.accentHue, p.hue) + s.hueShift
        const alpha = 0.4 + 0.5 * Math.abs(Math.sin(p.life * 0.8 + p.hue * 6))
        ctx.fillStyle = hsl(hue, s.saturation, palette.lightness, alpha * 0.5)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.1 + p.hue * 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const url = out.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-visual-${res.id}-${Date.now()}.png`
    a.click()

    setExporting(false)
    setExported(true)
    setTimeout(() => setExported(false), 2500)
  }

  /* ---------- render ---------- */
  return (
    <section id="lab" className="relative z-[2] px-6 py-28 md:px-16 md:py-40">
      {/* header */}
      <div className="mb-12 md:mb-16">
        <p className="eyebrow">AI Visual Lab</p>
        <h2 className="display-lg mt-2 text-white">
          GENERATIVE
          <span className="gradient-text"> SYNTHESIS</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/45">
          An interactive AI-powered visual synthesis engine that generates
          unique abstract compositions in real time. Tune the field, morph
          the palette, export at production resolution.
        </p>
        <div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          <span>Artificial Intelligence</span>
          <span className="text-white/15">/</span>
          <span>2026</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* canvas */}
        <div className="lg:col-span-8">
          <div
            ref={wrapRef}
            className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 lg:aspect-auto lg:h-[560px]"
          >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

            {/* play / pause */}
            <button
              onClick={togglePlay}
              data-cursor="link"
              aria-label={playing ? 'Pause' : 'Play'}
              className="absolute bottom-4 left-4 flex items-center gap-2 border border-white/15 bg-black/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 backdrop-blur transition-colors hover:border-white/50"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? 'Pause' : 'Play'}
            </button>

            {/* seed chip */}
            <div className="absolute right-4 top-4 flex items-center gap-2 border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 backdrop-blur">
              <Sparkles size={11} className="text-[#d8ff3e]" />
              seed {settings.current.seed.toString(16).slice(0, 8)}
            </div>
          </div>
        </div>

        {/* control panel */}
        <div className="lg:col-span-4">
          <div className="border border-white/10 bg-white/[0.02] p-6">
            {/* seed prompt */}
            <p className="eyebrow mb-3">Seed Prompt</p>
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && synthesize()}
                placeholder="e.g. midnight ocean, neon storm…"
                className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2 text-xs text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-white/40"
              />
              <button
                onClick={synthesize}
                data-cursor="link"
                className="flex items-center gap-1.5 border border-[#d8ff3e] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#d8ff3e] transition-colors hover:bg-[#d8ff3e] hover:text-black"
              >
                <Wand2 size={12} />
                Synthesize
              </button>
            </div>

            {/* sliders */}
            <div className="mt-6 space-y-5">
              <Slider
                label="Speed / Flow"
                min={0.1}
                max={3}
                step={0.1}
                value={settings.current.speed}
                onChange={(v) => updateSetting('speed', v)}
              />
              <Slider
                label="Density / Complexity"
                min={100}
                max={2000}
                step={100}
                value={settings.current.density}
                onChange={(v) => updateSetting('density', v)}
              />
              <Slider
                label="Distortion / Turbulence"
                min={0.3}
                max={5}
                step={0.1}
                value={settings.current.turbulence}
                onChange={(v) => updateSetting('turbulence', v)}
              />
              <Slider
                label="Color Shift"
                min={0}
                max={360}
                step={1}
                value={settings.current.hueShift}
                onChange={(v) => updateSetting('hueShift', v)}
              />
            </div>

            {/* presets */}
            <div className="mt-6">
              <p className="eyebrow mb-3">Presets</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    data-cursor="link"
                    className={`border px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
                      palette.name === p.name
                        ? 'border-[#d8ff3e] text-[#d8ff3e]'
                        : 'border-white/15 text-white/50 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* export */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="eyebrow mb-3">Export</p>
              <div className="flex gap-2">
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as typeof resolution)}
                  className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 outline-none [&>option]:bg-[#101010] focus:border-white/40"
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} · {r.w}×{r.h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={exportSnapshot}
                  disabled={exporting}
                  data-cursor="project"
                  data-cursor-text={exporting ? '…' : 'PNG'}
                  className="flex flex-1 items-center justify-center gap-2 bg-[#d8ff3e] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black transition-all hover:bg-white disabled:opacity-50"
                >
                  <Download size={13} />
                  {exporting ? 'Rendering…' : exported ? 'Saved ✓' : 'Download Snapshot'}
                </button>
                <button
                  onClick={randomize}
                  data-cursor="link"
                  aria-label="Randomize seed"
                  className="flex items-center justify-center border border-white/15 px-3 text-white/60 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Shuffle size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.25em] text-white/50">
        <span>{label}</span>
        <span className="text-white/70">{Number(value).toFixed(step < 1 ? 1 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#d8ff3e]"
      />
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function mulberry(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
