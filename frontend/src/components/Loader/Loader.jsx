import { useEffect, useRef } from 'react'
import world from '../../utils/Store'

const PHASES = ['INITIALIZING CORE', 'COMPILING GEOMETRY', 'CALIBRATING LIGHT', 'LINKING PARTICLES', 'WORLD READY']

export default function Loader({ onComplete }) {
  const root = useRef(null)
  const barRef = useRef(null)
  const numRef = useRef(null)
  const phaseRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    let phase = 0
    let progress = 0
    const DURATION = 2200
    const STEP = 40

    const finish = () => {
      document.body.style.overflow = ''
      world.set({ loaded: true })
      if (root.current) {
        root.current.style.transition = 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)'
        root.current.style.transform = 'translateY(-100%)'
      }
      window.setTimeout(() => {
        if (root.current) root.current.style.display = 'none'
        onComplete?.()
      }, 1350)
    }

    // setTimeout-based progress: predictable duration, immune to render/RFC
    // starvation caused by the heavy 3D canvas warming up behind the loader.
    const interval = window.setInterval(() => {
      progress = Math.min(100, progress + 100 / (DURATION / STEP))

      const phaseIdx = Math.min(PHASES.length - 1, Math.floor((1 - Math.pow(1 - progress / 100, 3)) * PHASES.length))
      if (phaseIdx !== phase && phaseRef.current) {
        phase = phaseIdx
        const el = phaseRef.current
        el.style.transition = 'opacity 0.25s ease'
        el.style.opacity = '0'
        window.setTimeout(() => {
          if (el) {
            el.textContent = PHASES[phaseIdx]
            el.style.opacity = '1'
          }
        }, 260)
      }

      if (numRef.current) numRef.current.textContent = String(Math.round(progress)).padStart(3, '0')
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress / 100})`

      if (progress >= 100) {
        window.clearInterval(interval)
        finish()
      }
    }, STEP)

    return () => {
      window.clearInterval(interval)
      document.body.style.overflow = ''
    }
  }, [onComplete])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#050505]"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">NOVA&nbsp;/&nbsp;STUDIO</p>
        <h1 className="display-mega text-white/90">INITIALIZING</h1>
        <h1 className="display-mega text-white/90 -mt-1">DIGITAL WORLD</h1>
      </div>

      <div className="absolute bottom-10 left-1/2 w-[70%] max-w-md -translate-x-1/2 md:w-[420px]">
        <div className="mb-4 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
          <span ref={phaseRef} className="opacity-0">
            {PHASES[0]}
          </span>
          <span ref={numRef} className="text-xl text-white/90">
            000
          </span>
        </div>
        <div className="h-px w-full overflow-hidden bg-white/10">
          <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-[#d8ff3e]" />
        </div>
      </div>
    </div>
  )
}