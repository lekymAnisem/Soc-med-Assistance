import { useEffect, useRef, useCallback } from 'react'
import world from '../utils/Store'

/**
 * Smoothed, normalized mouse position (-1..1) + refs for animation loops.
 * Returns { x, y } (state for render, refs for RAF loops) + subscribe.
 */
export default function useMousePosition(smoothing = 0.08) {
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const raw = useRef({ x: 0, y: 0 })
  const onMove = useCallback((e) => {
    target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
    target.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    raw.current.x = target.current.x
    raw.current.y = target.current.y
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    let raf = 0
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * smoothing
      current.current.y += (target.current.y - current.current.y) * smoothing
      world.set({ mouseX: current.current.x, mouseY: current.current.y })
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [smoothing, onMove])

  return {
    x: current.current.x,
    y: current.current.y,
    ref: current,
    raw: raw,
  }
}