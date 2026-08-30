import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import world from '../utils/Store'

/**
 * Subtle camera drift — gentle mouse parallax and a slow breathing motion.
 * No scroll-driven travel; stays calm and centered.
 */
export default function CameraRig() {
  const target = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    const s = world.get()
    const cam = state.camera
    const t = state.clock.elapsedTime

    target.current.x = s.mouseX * 0.55
    target.current.y = s.mouseY * 0.4

    cam.position.x += (target.current.x - cam.position.x) * 0.03
    cam.position.y += (target.current.y + Math.sin(t * 0.1) * 0.08 - cam.position.y) * 0.03
    cam.lookAt(0, 0, 0)
  })

  return null
}