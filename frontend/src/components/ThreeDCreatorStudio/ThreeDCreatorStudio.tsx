import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Box, Circle, Sparkles, Rotate3D, Download, Send, Shuffle } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type GeometryId = 'sphere' | 'box' | 'torusKnot' | 'icosahedron'
type EnvPreset = 'city' | 'sunset' | 'studio' | 'dawn' | 'night'

const GEOMETRIES: Record<GeometryId, { label: string; args: any[] }> = {
  sphere: { label: 'Sphere', args: [1.4, 48, 48] },
  box: { label: 'Box', args: [1.8, 1.8, 1.8] },
  torusKnot: { label: 'Torus Knot', args: [1.1, 0.4, 128, 24] },
  icosahedron: { label: 'Icosahedron', args: [1.5, 3] },
}

const ENV_PRESETS: { id: EnvPreset; label: string }[] = [
  { id: 'city', label: 'City' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'studio', label: 'Studio' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'night', label: 'Night' },
]

const GENERATED_GEOS: { fn: () => any }[] = [
  () => <dodecahedronGeometry args={[1.4, 1]} />,
  () => <octahedronGeometry args={[1.5, 0]} />,
  () => <torusGeometry args={[1.2, 0.45, 48, 32]} />,
  () => <coneGeometry args={[1.3, 2.2, 32]} />,
  () => <ringGeometry args={[0.6, 1.5, 48]} />,
]

/* ------------------------------------------------------------------ */
/* 3D scene components                                                 */
/* ------------------------------------------------------------------ */

function ActiveMesh({
  geometryId,
  color,
  metalness,
  roughness,
  wireframe,
  generating,
  generatedIdx,
  onInteractingChange,
}: {
  geometryId: GeometryId
  color: string
  metalness: number
  roughness: number
  wireframe: boolean
  generating: boolean
  generatedIdx: number | null
  onInteractingChange: (v: boolean) => void
}) {
  const group = useRef<THREE.Group>(null)
  const [interacting, setInteracting] = useState(false)

  useEffect(() => {
    onInteractingChange(interacting)
  }, [interacting, onInteractingChange])

  useFrame((_, delta) => {
    if (group.current && !interacting) {
      group.current.rotation.y += delta * 0.35
    }
  })

  const geo = GEOMETRIES[geometryId]

  return (
    <group ref={group}>
      {generating ? (
        <mesh>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color={color} wireframe opacity={0.6} transparent />
        </mesh>
      ) : generatedIdx !== null ? (
        <mesh>
          {GENERATED_GEOS[generatedIdx]()}
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} wireframe={wireframe} />
        </mesh>
      ) : (
        <mesh>
          {geometryId === 'sphere' ? <sphereGeometry args={[1.4, 48, 48]} /> :
           geometryId === 'box' ? <boxGeometry args={[1.8, 1.8, 1.8]} /> :
           geometryId === 'torusKnot' ? <torusKnotGeometry args={[1.1, 0.4, 128, 24]} /> :
           <icosahedronGeometry args={[1.5, 3]} />}
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} wireframe={wireframe} />
        </mesh>
      )}
    </group>
  )
}

function Capture({ onReady }: { onReady: (fn: () => string) => void }) {
  const { gl, scene, camera } = useThree()
  const api = useMemo(
    () => ({
      capture: () => {
        gl.render(scene, camera)
        return gl.domElement.toDataURL('image/png')
      },
    }),
    [gl, scene, camera]
  )
  useEffect(() => {
    onReady(api.capture)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 6, 4]} intensity={2.2} color="#fff7e6" />
      <directionalLight position={[-6, 2, -4]} intensity={0.8} color="#818cf8" />
      <pointLight position={[0, 3, 0]} intensity={20} distance={12} color="#a5b4fc" />
    </>
  )
}

/** Offline-safe environment — renders Lightformers locally, no remote HDR fetch. */
function LocalEnvironment({ preset }: { preset: EnvPreset }) {
  const palettes: Record<EnvPreset, { key: string; accent: string; fill: string; side: string }> = {
    city: { key: '#334155', accent: '#38bdf8', fill: '#1e293b', side: '#818cf8' },
    sunset: { key: '#f59e0b', accent: '#fb7185', fill: '#7c2d12', side: '#fbbf24' },
    studio: { key: '#94a3b8', accent: '#e2e8f0', fill: '#334155', side: '#818cf8' },
    dawn: { key: '#f472b6', accent: '#a5b4fc', fill: '#312e81', side: '#f0abfc' },
    night: { key: '#0ea5e9', accent: '#6366f1', fill: '#0f172a', side: '#22d3ee' },
  }
  const p = palettes[preset]
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} color={p.fill} />
      <Lightformer intensity={1.4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.5, 1]} color={p.side} />
      <Lightformer intensity={1.6} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} color={p.accent} />
      <Lightformer intensity={1} rotation-x={Math.PI / 2} position={[0, -5, 0]} scale={[10, 10, 1]} color={p.key} />
    </Environment>
  )
}

/* ------------------------------------------------------------------ */
/* Section component                                                   */
/* ------------------------------------------------------------------ */

export default function ThreeDCreatorStudio() {
  /* mesh state */
  const [geometryId, setGeometryId] = useState<GeometryId>('torusKnot')
  const [color, setColor] = useState('#818cf8')
  const [metalness, setMetalness] = useState(0.5)
  const [roughness, setRoughness] = useState(0.3)
  const [wireframe, setWireframe] = useState(false)
  const [envPreset, setEnvPreset] = useState<EnvPreset>('studio')

  /* AI generation */
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedIdx, setGeneratedIdx] = useState<number | null>(null)

  /* capture */
  const captureRef = useRef<(() => string) | null>(null)
  const handleCaptureReady = useCallback((fn: () => string) => {
    captureRef.current = fn
  }, [])

  /* auto-rotation pause */
  const [interacting, setInteracting] = useState(false)

  const handleGenerate = () => {
    if (generating) return
    setGenerating(true)
    setGeneratedIdx(null)
    window.setTimeout(() => {
      const idx = Math.floor(Math.random() * GENERATED_GEOS.length)
      const hue = Math.random() * 360
      setGeneratedIdx(idx)
      setColor(`hsl(${hue}, 70%, 60%)`)
      setGenerating(false)
    }, 2200)
  }

  const handleDownload = () => {
    const fn = captureRef.current
    if (!fn) return
    const url = fn()
    const a = document.createElement('a')
    a.href = url
    a.download = `3d-studio-${geometryId}-${Date.now()}.png`
    a.click()
  }

  const handleRandomize = () => {
    const keys = Object.keys(GEOMETRIES) as GeometryId[]
    const randomKey = keys[Math.floor(Math.random() * keys.length)]
    setGeometryId(randomKey)
    const hue = Math.random() * 360
    setColor(`hsl(${hue}, 65%, 55%)`)
    setMetalness(Math.random() * 0.8 + 0.1)
    setRoughness(Math.random() * 0.7 + 0.1)
    setWireframe(false)
    setGeneratedIdx(null)
  }

  return (
    <section id="studio-3d" className="relative z-[2] px-6 py-28 md:px-16 md:py-40">
      {/* header */}
      <div className="mb-10 md:mb-14">
        <p className="eyebrow">3D Creation Lab</p>
        <h2 className="display-lg mt-2 text-white">
          MESH
          <span className="gradient-text"> STUDIO</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/45">
          An interactive, browser-based 3D engine to generate and manipulate
          meshes in real-time. Customize materials, switch environments, and
          export a snapshot.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* canvas */}
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden border border-white/10 bg-[#05060a]">
            <div className="h-[400px] w-full md:h-[520px]">
              <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ fov: 45, near: 0.1, far: 40, position: [3.5, 2.5, 4.5] }}>
                <Suspense fallback={null}>
                  <SceneLights />
                  {false && <LocalEnvironment preset={envPreset} />}
                  <ActiveMesh
                    geometryId={geometryId}
                    color={color}
                    metalness={metalness}
                    roughness={roughness}
                    wireframe={wireframe}
                    generating={generating}
                    generatedIdx={generatedIdx}
                    onInteractingChange={setInteracting}
                  />
                  <Capture onReady={handleCaptureReady} />
                </Suspense>
                <OrbitControls
                  enableDamping
                  dampingFactor={0.08}
                  minDistance={2.5}
                  maxDistance={12}
                  enablePan={false}
                  onStart={() => setInteracting(true)}
                  onEnd={() => setInteracting(false)}
                />
              </Canvas>
            </div>

            {/* AI generation bar */}
            <div className="flex items-center gap-2 border-t border-white/10 p-3">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                disabled={generating}
                placeholder="Describe a 3D object to generate…"
                className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2 text-xs text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-white/40 disabled:opacity-40"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                data-cursor="link"
                className="flex items-center gap-1.5 border border-[#818cf8] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#818cf8] transition-colors hover:bg-[#818cf8] hover:text-black disabled:opacity-40"
              >
                <Sparkles size={12} />
                {generating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* sidebar controls */}
        <div className="lg:col-span-4">
          <div className="border border-white/10 bg-white/[0.02] p-5">
            {/* geometry selector */}
            <p className="eyebrow mb-3">Base Geometry</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(GEOMETRIES) as [GeometryId, { label: string }][]).map(([id, geo]) => (
                <button
                  key={id}
                  data-cursor="link"
                  onClick={() => { setGeometryId(id); setGeneratedIdx(null) }}
                  className={`px-3 py-2 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
                    geometryId === id ? 'bg-[#818cf8] text-black' : 'border border-white/15 text-white/55 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {geo.label}
                </button>
              ))}
              <button
                onClick={handleRandomize}
                data-cursor="link"
                className="flex items-center gap-1 border border-white/15 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/40 transition-colors hover:border-white/40 hover:text-white"
              >
                <Shuffle size={11} />
                Random
              </button>
            </div>

            {/* material editor */}
            <div className="mt-6">
              <p className="eyebrow mb-3">Material</p>

              {/* color */}
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
                />
                <input
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    if (/^#[0-9a-fA-F]{6}$/.test(v) || /^hsl\(/.test(v)) setColor(v)
                  }}
                  className="min-w-0 flex-1 border border-white/15 bg-transparent px-2 py-2 font-mono text-[10px] text-white/80 outline-none focus:border-white/40"
                />
              </div>

              <Slider label="Metalness" min={0} max={1} step={0.01} value={metalness} onChange={setMetalness} />
              <Slider label="Roughness" min={0} max={1} step={0.01} value={roughness} onChange={setRoughness} />

              <label className="mt-4 flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 transition-colors hover:border-white/40">
                <input
                  type="checkbox"
                  checked={wireframe}
                  onChange={(e) => setWireframe(e.target.checked)}
                  className="accent-[#818cf8]"
                />
                Wireframe
              </label>
            </div>

            {/* environment */}
            <div className="mt-6">
              <p className="eyebrow mb-3">Environment</p>
              <select
                value={envPreset}
                onChange={(e) => setEnvPreset(e.target.value as EnvPreset)}
                className="w-full border border-white/15 bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 outline-none [&>option]:bg-[#0a0f1c] focus:border-white/40"
              >
                {ENV_PRESETS.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            </div>

            {/* export */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                onClick={handleDownload}
                data-cursor="project"
                data-cursor-text="PNG"
                className="flex w-full items-center justify-center gap-2 bg-[#818cf8] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-black transition-all hover:bg-white"
              >
                <Download size={13} />
                Download Snapshot
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Slider sub-component                                                */
/* ------------------------------------------------------------------ */

function Slider({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void
}) {
  return (
    <label className="mb-3 block">
      <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.25em] text-white/50">
        <span>{label}</span>
        <span className="text-white/70">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#818cf8]"
      />
    </label>
  )
}