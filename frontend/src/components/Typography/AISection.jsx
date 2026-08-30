import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import useSectionProgress from '../../hooks/useSectionProgress'
import world from '../../utils/Store'

gsap.registerPlugin(ScrollTrigger)

export default function AISection() {
  const [ref, progress] = useSectionProgress({
    start: 'top 80%',
    end: 'top 20%',
    onUpdate: (p) => world.set({ ai: p }),
  })

  const line1 = useRef(null)
  const line2 = useRef(null)
  const line3 = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.6,
        },
      })
      tl.fromTo(line1.current, { x: -80, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' })
        .fromTo(line2.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' }, '-=0.7')
        .fromTo(line3.current, { x: -40, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' }, '-=0.7')
    }, el)
    return () => ctx.revert()
  }, [ref])

  return (
    <section id="ai" ref={ref} className="relative z-[2] flex min-h-screen items-center px-6 md:px-16">
      <div>
        <p className="eyebrow mb-6">Laboratory</p>
        <h2 className="display-xl text-white">
          <span ref={line1} className="block">
            INTELLIGENCE
          </span>
          <span ref={line2} className="block text-white/60">
            MEETS
          </span>
          <span ref={line3} className="block text-[#d8ff3e]">
            CREATIVITY.
          </span>
        </h2>
        <p className="mt-8 max-w-sm text-sm font-light leading-relaxed text-white/40">
          We explore the frontier where generative models, neural
          rendering and real-time interaction converge into new
          creative workflows.
        </p>
      </div>
    </section>
  )
}