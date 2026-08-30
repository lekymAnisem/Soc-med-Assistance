import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { particleVert, particleFrag } from './shaders/particles'

/**
 * Minimal, calm starfield — slow floating points with additive blending.
 * No scroll acceleration, no aggressive motion.
 */
export default function ParticleField({ count = 900, radius = [5, 20], quality = 'high' }) {
  const points = useRef(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: quality === 'low' ? 10 : 14 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor1: { value: new THREE.Color('#ffffff') },
      uColor2: { value: new THREE.Color('#8faeff') },
    }),
    [quality]
  )

  const geometry = useMemo(() => {
    const n = count
    const positions = new Float32Array(n * 3)
    const scales = new Float32Array(n)
    const randoms = new Float32Array(n * 3)

    for (let i = 0; i < n; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius[0] + Math.pow(Math.random(), 0.6) * (radius[1] - radius[0])

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.75
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

      scales[i] = 0.4 + Math.random() * 1.2
      randoms[i * 3] = Math.random()
      randoms[i * 3 + 1] = Math.random()
      randoms[i * 3 + 2] = Math.random()
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    g.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3))
    return g
  }, [count, radius])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVert,
        fragmentShader: particleFrag,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  )

  useFrame((state, delta) => {
    uniforms.uTime.value += delta
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.012
    }
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}