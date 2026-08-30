import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Zap, Car, Leaf, AlertTriangle, X, Radio, Cpu, Gauge, ShieldAlert, Sun, Wind, Power } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type ScenarioId = 'nominal' | 'solar' | 'lockdown' | 'zero'

interface Scenario {
  id: ScenarioId
  label: string
  accent: string
  accentObj: number
  volatility: number
  trafficCap: number
  gridBase: number
  latencyBase: number
  aqiBase: number
  trafficBase: number
  alerts: string[]
  blurb: string
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  nominal: {
    id: 'nominal',
    label: 'Nominal Operations',
    accent: '#22d3ee',
    accentObj: 0x22d3ee,
    volatility: 0.06,
    trafficCap: 100,
    gridBase: 7.4,
    latencyBase: 42,
    aqiBase: 28,
    trafficBase: 46,
    alerts: ['GRID LOAD STABLE', 'LATENCY WITHIN SLA', 'CORE SECTORS NOMINAL'],
    blurb: 'Standard city-state equilibrium. All systems within expected parameters.',
  },
  solar: {
    id: 'solar',
    label: 'Solar Flare Surge',
    accent: '#f59e0b',
    accentObj: 0xf59e0b,
    volatility: 0.42,
    trafficCap: 100,
    gridBase: 16.8,
    latencyBase: 118,
    aqiBase: 74,
    trafficBase: 58,
    alerts: ['FLARE DETECTED · GRID SURGE', 'CONDUIT OVERLOAD WARNING', 'CACHE DECAY ELEVATED'],
    blurb: 'Coronal mass ejection striking the array. Power conduits overloading.',
  },
  lockdown: {
    id: 'lockdown',
    label: 'Cyber Protocol Lockdown',
    accent: '#fb7185',
    accentObj: 0xfb7185,
    volatility: 0.24,
    trafficCap: 100,
    gridBase: 9.1,
    latencyBase: 163,
    aqiBase: 51,
    trafficBase: 97,
    alerts: ['LOCKDOWN ENGAGED', 'TRANSIT PERIMETER CLOSED', 'AUTH CHANNELS VERIFYING'],
    blurb: 'Perimeter sealed. Autonomous traffic frozen at maximum density.',
  },
  zero: {
    id: 'zero',
    label: 'Zero-Emission Flux',
    accent: '#34d399',
    accentObj: 0x34d399,
    volatility: 0.04,
    trafficCap: 100,
    gridBase: 3.2,
    latencyBase: 21,
    aqiBase: 9,
    trafficBase: 34,
    alerts: ['EMISSIONS AT ZERO', 'AIR QUALITY PRIME', 'RENEWABLE FEED 100%'],
    blurb: 'Clean-energy cascade. Every conduit running on stored flux.',
  },
}

interface Sector {
  id: string
  x: number
  z: number
  wx: number
  wz: number
  height: number
  heat: number
  energy: number
}

const GRID = 12
const SPACING = 1.15
const OFFSET = (GRID - 1) / 2

const LAYERS = [
  { id: 'energy', label: 'Energy Grid', icon: Zap, color: '#22d3ee' },
  { id: 'transit', label: 'Transit Flow', icon: Car, color: '#a78bfa' },
  { id: 'environment', label: 'Environmental', icon: Leaf, color: '#34d399' },
] as const

type LayerId = (typeof LAYERS)[number]['id']

const LOG_HINTS = [
  'SYNC PACKET ACK 0x3F2A',
  'STREAM REBALANCED',
  'NODE 14 TELEMETRY FLUSHED',
  'QUANTUM CHANNEL 7 HANDSHAKE OK',
  'EDGE CACHE HIT 98.2%',
  'SECTOR SELF-CHECK PASSED',
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
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

function fmtTime(d = new Date()) {
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

/* ------------------------------------------------------------------ */
/* 3D sub-components                                                   */
/* ------------------------------------------------------------------ */

function CityMatrix({
  sectors,
  scenario,
  layers,
  selected,
  onSelect,
}: {
  sectors: Sector[]
  scenario: Scenario
  layers: Record<LayerId, boolean>
  selected: string | null
  onSelect: (id: string) => void
}) {
  const group = useRef<THREE.Group>(null)
  const energyMat = useRef<THREE.LineBasicMaterial>(null)
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selected

  // building materials — one per sector so selected can pulse
  const mats = useMemo(() => {
    const arr: THREE.MeshStandardMaterial[] = []
    for (let i = 0; i < sectors.length; i++) {
      arr.push(
        new THREE.MeshStandardMaterial({
          color: '#0a0f1c',
          metalness: 0.75,
          roughness: 0.35,
          emissive: new THREE.Color(scenario.accentObj),
          emissiveIntensity: 0.12,
        })
      )
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // energy line pulse
    if (energyMat.current) {
      energyMat.current.opacity = layers.energy ? 0.35 + Math.sin(t * 2.2) * 0.3 : 0
    }
    // buildings pulse + selected highlight
    for (let i = 0; i < mats.length; i++) {
      const s = sectors[i]
      const pulse = 0.1 + 0.05 * Math.sin(t * 1.6 + s.wx * 0.6 + s.wz * 0.6)
      const isSel = selectedRef.current === s.id
      mats[i].emissiveIntensity = isSel ? 0.7 + Math.sin(t * 4) * 0.3 : pulse
      mats[i].emissive.set(isSel ? 0xffffff : scenario.accentObj)
    }
  })

  // energy grid line segments between adjacent sectors
  const { energyGeo } = useMemo(() => {
    const positions: number[] = []
    for (const s of sectors) {
      const n = sectors.find((o) => o.x === s.x && o.z === s.z + 1)
      const e = sectors.find((o) => o.x === s.x + 1 && o.z === s.z)
      for (const nbr of [n, e]) {
        if (!nbr) continue
        positions.push(s.wx, 0.06, s.wz, nbr.wx, 0.06, nbr.wz)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return { energyGeo: g }
  }, [sectors])

  // floating data markers above a subset of buildings
  const { markerGeo } = useMemo(() => {
    const positions: number[] = []
    const rng = mulberry(2025)
    for (let i = 0; i < sectors.length; i++) {
      if (rng() > 0.18) continue
      const s = sectors[i]
      positions.push(s.wx, s.height + 0.9, s.wz)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return { markerGeo: g }
  }, [sectors])

  return (
    <group ref={group}>
      {/* ground grid */}
      <gridHelper args={[GRID * SPACING, GRID, '#1e293b', '#111827']} position={[0, -0.02, 0]} />

      {/* buildings */}
      {sectors.map((s, i) => (
        <mesh
          key={s.id}
          position={[s.wx, s.height / 2, s.wz]}
          material={mats[i]}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(s.id)
          }}
        >
          <boxGeometry args={[0.8, s.height, 0.8]} />
        </mesh>
      ))}

      {/* energy grid */}
      {layers.energy && (
        <lineSegments geometry={energyGeo}>
          <lineBasicMaterial ref={energyMat} color={scenario.accentObj} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
      )}

      {/* data markers */}
      <points geometry={markerGeo}>
        <pointsMaterial size={0.12} color={scenario.accentObj} transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

function TransitFlow({ scenario, enabled }: { scenario: Scenario; enabled: boolean }) {
  const points = useRef<THREE.Points>(null)
  const count = 260

  const { geometry, velocities, bases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const vel = new Float32Array(count * 2)
    const base = new Float32Array(count * 2)
    const half = (GRID * SPACING) / 2
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * GRID * SPACING * 0.9
      positions[i * 3 + 1] = 0.25
      positions[i * 3 + 2] = (Math.random() - 0.5) * GRID * SPACING * 0.9
      // horizontal or vertical lane
      const vertical = Math.random() > 0.5
      vel[i * 2] = vertical ? 0 : (Math.random() > 0.5 ? 1 : -1) * 0.6
      vel[i * 2 + 1] = vertical ? (Math.random() > 0.5 ? 1 : -1) * 0.6 : 0
      base[i * 2] = positions[i * 3]
      base[i * 2 + 1] = positions[i * 3 + 2]
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: g, velocities: vel, bases: base }
  }, [])

  useFrame((state, delta) => {
    if (!enabled || !points.current) return
    const pos = geometry.attributes.position
    const arr = pos.array as Float32Array
    const speed = (0.35 + scenario.volatility * 1.1) * delta
    const half = (GRID * SPACING) / 2
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 2] * speed
      arr[i * 3 + 2] += velocities[i * 2 + 1] * speed
      if (Math.abs(arr[i * 3]) > half) velocities[i * 2] *= -1
      if (Math.abs(arr[i * 3 + 2]) > half) velocities[i * 2 + 1] *= -1
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry} visible={enabled}>
      <pointsMaterial size={0.1} color={scenario.accentObj} transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function EnvironmentLayer({ scenario, enabled, sectors }: { scenario: Scenario; enabled: boolean; sectors: Sector[] }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!enabled) return
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.clearRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'lighter'

    const span = GRID * SPACING
    for (const s of sectors) {
      const cx = ((s.wx / span) + 0.5) * size
      const cy = ((s.wz / span) + 0.5) * size
      const r = size * 0.05 + s.height * size * 0.03
      const heat = Math.min(1, s.heat + scenario.volatility * 0.4)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      const c = heatColor(heat, scenario)
      grad.addColorStop(0, c)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    setTexture(tex)
    return () => tex.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scenario])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} visible={enabled && !!texture}>
      <planeGeometry args={[GRID * SPACING, GRID * SPACING]} />
      <meshBasicMaterial map={texture ?? undefined} transparent opacity={0.75} depthWrite={false} />
    </mesh>
  )
}

function heatColor(heat: number, scenario: Scenario) {
  // blue -> amber/red heat ramp, tinted by scenario accent
  const r = Math.round(20 + heat * 235)
  const g = Math.round(140 - heat * 100)
  const b = Math.round(230 - heat * 160)
  return `rgba(${r},${g},${b},0.85)`
}

function Rig({ scenario }: { scenario: Scenario }) {
  useFrame(({ scene }) => {
    // tint fog + background by scenario
    scene.fog = new THREE.Fog(scenario.accentObj, 28, 55)
  })
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={8}
      maxDistance={34}
      minPolarAngle={0.6}
      maxPolarAngle={1.35}
      target={[0, 1.5, 0]}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function DigitalFuturesTwin() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('nominal')
  const scenario = SCENARIOS[scenarioId]
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({ energy: true, transit: true, environment: false })
  const [selected, setSelected] = useState<string | null>(null)
  const [telemetry, setTelemetry] = useState({ grid: 7.4, latency: 42, aqi: 28, traffic: 46 })
  const [log, setLog] = useState<{ time: string; msg: string; type: 'info' | 'warn' | 'alert' }[]>([
    { time: fmtTime(), msg: 'DIGITAL TWIN LINK ESTABLISHED', type: 'info' },
  ])

  const sectors = useMemo<Sector[]>(() => {
    const rng = mulberry(777)
    const list: Sector[] = []
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        const height = 0.5 + rng() * 2.4
        list.push({
          id: `S${String(x).padStart(2, '0')}-${String(z).padStart(2, '0')}`,
          x,
          z,
          wx: (x - OFFSET) * SPACING,
          wz: (z - OFFSET) * SPACING,
          height,
          heat: 0.15 + rng() * 0.7,
          energy: 2 + rng() * 14,
        })
      }
    }
    return list
  }, [])

  /* ---------- telemetry simulation ---------- */
  useEffect(() => {
    setTelemetry({
      grid: scenario.gridBase,
      latency: scenario.latencyBase,
      aqi: scenario.aqiBase,
      traffic: scenario.trafficBase,
    })

    const interval = window.setInterval(() => {
      const v = scenario.volatility
      const jitter = (min: number, max: number, base: number) =>
        Math.min(max, Math.max(min, base + (Math.random() - 0.5) * 2 * v * max))

      setTelemetry((prev) => ({
        grid: jitter(0, 20, prev.grid),
        latency: jitter(5, 220, prev.latency),
        aqi: jitter(2, 160, prev.aqi),
        traffic: Math.min(scenario.trafficCap, jitter(0, 100, prev.traffic)),
      }))

      // occasional log line
      if (Math.random() < 0.42) {
        const isAlert = Math.random() < 0.25
        const pool = isAlert ? scenario.alerts : LOG_HINTS
        const msg = pool[Math.floor(Math.random() * pool.length)]
        setLog((prev) =>
          [
            ...prev.slice(-24),
            { time: fmtTime(), msg, type: isAlert ? (scenario.id === 'nominal' ? 'warn' : 'alert') : 'info' },
          ].slice(-25)
        )
      }
    }, 1400)

    return () => window.clearInterval(interval)
  }, [scenario])

  const toggleLayer = useCallback((id: LayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const selectScenario = useCallback((id: ScenarioId) => {
    setScenarioId(id)
    setSelected(null)
    setLog((prev) => [
      ...prev.slice(-24),
      { time: fmtTime(), msg: `SCENARIO → ${SCENARIOS[id].label.toUpperCase()}`, type: 'info' },
    ])
  }, [])

  const selectedSector = selected ? sectors.find((s) => s.id === selected) ?? null : null

  return (
    <section id="futures" className="relative z-[2] px-6 py-28 md:px-16 md:py-40">
      {/* header */}
      <div className="mb-10 md:mb-14">
        <p className="eyebrow">Digital Futures</p>
        <h2 className="display-lg mt-2 text-white">
          URBAN
          <span className="gradient-text"> DIGITAL TWIN</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/45">
          A speculative digital twin of a future city, blending real-time
          data streams with generative 3D environments. Orbit the matrix,
          inspect sectors, and switch city-wide scenarios.
        </p>
        <div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          <span>Experience Design</span>
          <span className="text-white/15">/</span>
          <span>2025</span>
        </div>
      </div>

      {/* twin container */}
      <div className="relative overflow-hidden border border-white/10 bg-[#020617]/60">
        <div className="relative h-[420px] w-full md:h-[560px]">
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 42, near: 0.1, far: 80, position: [16, 13, 16] }}
            style={{ background: '#020617' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[8, 14, 6]} intensity={1.4} color="#7dd3fc" />
            <directionalLight position={[-10, 6, -8]} intensity={0.4} color="#6366f1" />
            <pointLight position={[0, 8, 0]} intensity={30} distance={30} color={scenario.accentObj} />
            <CityMatrix sectors={sectors} scenario={scenario} layers={layers} selected={selected} onSelect={setSelected} />
            <TransitFlow scenario={scenario} enabled={layers.transit} />
            <EnvironmentLayer scenario={scenario} enabled={layers.environment} sectors={sectors} />
            <Rig scenario={scenario} />
          </Canvas>

          {/* ── HUD: layer toggles ── */}
          <div className="absolute left-4 top-4 z-10">
            <div className="border border-white/10 bg-black/40 p-3 backdrop-blur">
              <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
                Data Layers
              </p>
              <div className="flex flex-col gap-1.5">
                {LAYERS.map((l) => {
                  const on = layers[l.id]
                  return (
                    <button
                      key={l.id}
                      data-cursor="link"
                      onClick={() => toggleLayer(l.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                        on ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                      style={on ? { color: l.color, background: `${l.color}14` } : undefined}
                    >
                      <l.icon size={11} />
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── HUD: scenario presets ── */}
          <div className="absolute right-4 top-4 z-10 hidden md:block">
            <div className="border border-white/10 bg-black/40 p-3 backdrop-blur">
              <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
                Scenario
              </p>
              <div className="flex flex-col gap-1.5">
                {(Object.values(SCENARIOS) as Scenario[]).map((s) => (
                  <button
                    key={s.id}
                    data-cursor="link"
                    onClick={() => selectScenario(s.id)}
                    className={`px-2 py-1.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
                      scenarioId === s.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                    }`}
                    style={scenarioId === s.id ? { color: s.accent, background: `${s.accent}14` } : undefined}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* scenario blurb */}
          <div className="absolute bottom-4 left-4 z-10 hidden max-w-xs md:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: scenario.accent }}>
              {scenario.label}
            </p>
            <p className="mt-1 text-[11px] font-light leading-relaxed text-white/45">{scenario.blurb}</p>
          </div>

          {/* ── Sector inspector ── */}
          {selectedSector && (
            <div className="absolute bottom-4 right-4 z-20 w-[260px] border bg-black/60 p-4 backdrop-blur" style={{ borderColor: `${scenario.accent}55` }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: scenario.accent }}>
                  Sector {selectedSector.id}
                </span>
                <button data-cursor="link" onClick={() => setSelected(null)} aria-label="Close">
                  <X size={13} className="text-white/50 hover:text-white" />
                </button>
              </div>
              <div className="space-y-1.5 font-mono text-[10px] text-white/60">
                <Row label="Energy Load" value={`${(selectedSector.energy + scenario.volatility * 10).toFixed(1)} GW`} />
                <Row label="Occupancy" value={`${Math.round(40 + selectedSector.height * 22)}%`} />
                <Row label="Heat Index" value={`${Math.round(selectedSector.heat * 40 + 22)}°C`} />
                <Row label="Status" value={statusFor(selectedSector, scenario)} accent={statusColor(scenario)} />
              </div>
            </div>
          )}
        </div>

        {/* ── Telemetry ticker ── */}
        <div className="border-t border-white/10 bg-black/60">
          <div className="flex flex-wrap items-stretch divide-x divide-white/10">
            <Metric icon={Power} label="Grid Load" value={`${telemetry.grid.toFixed(1)}`} unit="GW" accent={scenario.accent} />
            <Metric icon={Gauge} label="Q. Latency" value={`${Math.round(telemetry.latency)}`} unit="ms" accent={scenario.accent} />
            <Metric icon={Wind} label="Air Quality" value={`${Math.round(telemetry.aqi)}`} unit="AQI" accent={scenario.accent} />
            <Metric icon={Car} label="Traffic" value={`${Math.round(telemetry.traffic)}`} unit="%" accent={scenario.accent} />
          </div>
          {/* terminal log */}
          <div className="h-28 overflow-hidden bg-black/70 px-4 py-2">
            <div className="flex flex-col gap-0.5">
              {[...log].reverse().map((l, i) => (
                <div key={i} className="flex items-baseline gap-2 font-mono text-[10px] leading-snug">
                  <span className="shrink-0 text-white/30">[{l.time}]</span>
                  <span
                    className={
                      l.type === 'alert'
                        ? 'text-rose-400'
                        : l.type === 'warn'
                          ? 'text-amber-400'
                          : 'text-cyan-300/80'
                    }
                  >
                    ▸ {l.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Small sub-components                                                */
/* ------------------------------------------------------------------ */

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-1">
      <span className="text-white/35">{label}</span>
      <span className={accent ? '' : 'text-white/80'} style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  )
}

function statusFor(s: Sector, scenario: Scenario) {
  if (scenario.id === 'lockdown') return 'SEALED'
  if (scenario.id === 'solar') return s.heat > 0.6 ? 'OVERLOAD' : 'SURGE'
  if (scenario.id === 'zero') return 'CLEAN'
  return s.heat > 0.55 ? 'DEGRADED' : 'STABLE'
}

function statusColor(scenario: Scenario) {
  return scenario.id === 'lockdown' ? '#fb7185' : scenario.id === 'solar' ? '#f59e0b' : scenario.accent
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: typeof Zap
  label: string
  value: string
  unit: string
  accent: string
}) {
  return (
    <div className="flex min-w-[25%] flex-1 items-center gap-3 px-4 py-3">
      <Icon size={14} style={{ color: accent }} />
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/35">{label}</p>
        <p className="font-mono text-sm text-white">
          {value} <span className="text-[10px] text-white/40">{unit}</span>
        </p>
      </div>
    </div>
  )
}