import { useEffect, useRef, useCallback } from 'react'
import useMousePosition from '../../hooks/useMousePosition'

const DOT = 6
const RING = 30

const STATES = {
  default: { ringScale: 1, dotScale: 1, opacity: 1, blend: 'normal' },
  text: { ringScale: 1.7, dotScale: 0.4, opacity: 1, blend: 'difference' },
  project: { ringScale: 3.6, dotScale: 0.2, opacity: 1, blend: 'normal' },
  link: { ringScale: 2.2, dotScale: 0.3, opacity: 1, blend: 'difference' },
  hidden: { ringScale: 0, dotScale: 0, opacity: 0, blend: 'normal' },
}

export default function CustomCursor() {
  const mouse = useMousePosition(0.09)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const labelRef = useRef(null)
  const pos = useRef({ x: 0, y: 0, sx: 0, sy: 0 })
  const st = useRef('default')

  const setState = useCallback((name = 'default', text = '') => {
    const cfg = STATES[name] || STATES.default
    st.current = name
    const r = ringRef.current
    const d = dotRef.current
    if (r) {
      r.style.opacity = cfg.opacity
      r.style.mixBlendMode = cfg.blend
      r.dataset.scale = cfg.ringScale
    }
    if (d) {
      d.style.opacity = cfg.opacity
      d.dataset.scale = cfg.dotScale
    }
    if (labelRef.current) {
      labelRef.current.textContent = text
      labelRef.current.style.opacity = text ? 1 : 0
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('has-cursor')

    const coarse = window.matchMedia('(pointer: coarse)')
    if (coarse.matches) {
      setState('hidden')
    }

    let raf = 0
    const loop = () => {
      const target = mouse.ref.current
      const p = pos.current
      p.sx += (target.x - p.sx) * 0.16
      p.sy += (target.y - p.sy) * 0.16
      p.x += (target.x - p.x) * 0.55
      p.y += (target.y - p.y) * 0.55

      const cx = (p.sx * 0.5 + 0.5) * window.innerWidth
      const cy = (p.sy * 0.5 + 0.5) * window.innerHeight
      const rx = (p.x * 0.5 + 0.5) * window.innerWidth
      const ry = (p.y * 0.5 + 0.5) * window.innerHeight

      const r = ringRef.current
      const d = dotRef.current
      const s = STATES[st.current] || STATES.default
      if (r) {
        r.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${s.ringScale})`
      }
      if (d) {
        d.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${s.dotScale})`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      document.body.classList.remove('has-cursor')
      cancelAnimationFrame(raf)
    }
  }, [mouse, setState])

  useEffect(() => {
    const onOver = (e) => {
      const el = e.target.closest('[data-cursor]')
      if (!el) {
        setState('default')
        return
      }
      setState(el.dataset.cursor || 'default', el.dataset.cursorText || '')
    }
    document.addEventListener('mouseover', onOver, { passive: true })
    return () => document.removeEventListener('mouseover', onOver)
  }, [setState])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9990] hidden md:block">
      <div
        ref={dotRef}
        className="fixed top-0 left-0 h-[6px] w-[6px] rounded-full"
        style={{ background: '#d8ff3e', transform: 'translate(-50%, -50%)' }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 flex items-center justify-center rounded-full border border-white/50"
        style={{
          width: RING,
          height: RING,
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'difference',
          transition: 'border-color 0.4s ease, opacity 0.4s ease',
        }}
      >
        <span
          ref={labelRef}
          className="font-mono text-[8px] uppercase tracking-[0.25em] text-white opacity-0"
          style={{ transition: 'opacity 0.3s ease' }}
        />
      </div>
    </div>
  )
}
