import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generatePlanetTexture, generateCloudMap } from './planetTexture'

/**
 * Realistic rotating planet with procedural texture, cloud layer,
 * atmosphere glow and a distant starfield. Texture is generated off the
 * main render path so the hero mounts instantly, then swaps in.
 */

function Starfield({ count = 1500 }) {
  const ref = useRef<THREE.Points>(null)
  const { geometry } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 12 + Math.random() * 20
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return {
      geometry: new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      ),
    }
  }, [count])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.004
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.06} color="#aebfff" transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function Planet({ textures }) {
  const group = useRef<THREE.Group>(null)
  const cloudRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) group.current.rotation.y = t * 0.05
    if (cloudRef.current) cloudRef.current.rotation.y = t * 0.022
  })

  return (
    <group ref={group}>
      {/* planet body */}
      <mesh>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshStandardMaterial
          map={textures.planetTex}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* cloud layer */}
      <mesh ref={cloudRef} scale={1.015}>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial
          map={textures.cloudTex}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.35, 48, 48]} />
        <meshBasicMaterial
          color="#7fb0ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Plain sphere shown while the procedural texture generates. */
function Placeholder() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.05
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.2, 48, 48]} />
      <meshStandardMaterial color="#3a5f8a" roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

function CameraRig() {
  useFrame((state) => {
    const cam = state.camera
    const t = state.clock.elapsedTime
    cam.position.x = state.pointer.x * 0.5 + Math.sin(t * 0.05) * 0.3
    cam.position.y = 0.4 + state.pointer.y * 0.4 + Math.sin(t * 0.08) * 0.2
    cam.lookAt(0, 0, 0)
  })
  return null
}

export default function Hero3DScene() {
  const [textures, setTextures] = useState(null)

  // generate textures off the render path so the hero mounts instantly
  useEffect(() => {
    let alive = true
    const t = window.setTimeout(() => {
      const planetTex = new THREE.TextureLoader().load(generatePlanetTexture())
      planetTex.colorSpace = THREE.SRGBColorSpace
      const cloudTex = new THREE.TextureLoader().load(generateCloudMap())
      cloudTex.colorSpace = THREE.SRGBColorSpace
      if (alive) setTextures({ planetTex, cloudTex })
    }, 30)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [])

  return (
    <div className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true, stencil: false }}
        camera={{ fov: 45, near: 0.1, far: 60, position: [0, 0.4, 6.5] }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 3, 4]} intensity={2.2} color="#fff7e6" />
          <directionalLight position={[-6, -2, -4]} intensity={0.25} color="#6f7bff" />
          {textures ? <Planet textures={textures} /> : <Placeholder />}
          <Starfield />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  )
}