import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import ParticleField from './ParticleField'
import CameraRig from './CameraRig'

/**
 * Calm, minimal background — a simple particle field with gentle mouse
 * parallax. No objects, post-processing, fog, or camera station travel.
 */
export default function DigitalWorld({ quality = 'high', isTouch }) {
  const dpr = quality === 'high' ? [1, 1.5] : quality === 'med' ? [1, 1.2] : [1, 1]
  const count = quality === 'high' ? 900 : quality === 'med' ? 500 : 200

  return (
    <div className="fixed inset-0 z-[1]" style={{ pointerEvents: 'none' }} aria-hidden>
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true, stencil: false, depth: false }}
        camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 12] }}
        frameloop="always"
      >
        <AdaptiveDpr pixelated />
        <ParticleField count={count} quality={quality} />
        <CameraRig />
      </Canvas>
    </div>
  )
}