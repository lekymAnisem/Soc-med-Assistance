import { useRef } from 'react'
import useSectionProgress from '../../hooks/useSectionProgress'
import world from '../../utils/Store'

export default function ExperimentSection() {
  const [ref, progress] = useSectionProgress({
    start: 'top 95%',
    end: 'bottom 5%',
    onUpdate: (p) => world.set({ experiment: p }),
  })

  const pct = Math.round(progress * 100)

  return (
    <section id="experiment" ref={ref} className="relative z-[2] flex min-h-[160vh] items-center justify-center px-6 md:px-16">
      <div className="flex w-full flex-col items-center text-center">
        <p className="eyebrow mb-6">Chapter 03 — Installation</p>
        <h2 className="display-xl text-white/90">THE EXPERIMENT</h2>
        <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-white/40">
          A continuous study in motion, light and space — every interaction
          is a small experiment in how digital worlds feel alive.
        </p>

        <div className="mt-12 font-mono text-[10px] tracking-[0.3em] text-white/30">
          PROGRESS {String(pct).padStart(3, '0')}%
        </div>
        <div className="mt-3 h-px w-40 bg-white/10 md:w-64">
          <div
            className="h-full bg-[#d8ff3e] transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  )
}