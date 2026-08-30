import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import useSectionProgress from '../../hooks/useSectionProgress'

gsap.registerPlugin(ScrollTrigger)

export default function Introduction() {
  const [ref, progress] = useSectionProgress({ start: 'top 90%', end: 'center 40%' })

  const lineARef = useRef(null)
  const lineBRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const split = (spanEl) => {
      if (!spanEl || spanEl.dataset.s) return []
      spanEl.dataset.s = '1'
      const text = spanEl.textContent.trim()
      spanEl.textContent = ''
      const words = text.split(' ')
      const frag = document.createDocumentFragment()
      words.forEach((w) => {
        const outer = document.createElement('span')
        outer.className = 'inline-block overflow-hidden align-top pb-1'
        const inner = document.createElement('span')
        inner.className = 'inline-block will-change-transform'
        inner.textContent = w
        outer.appendChild(inner)
        frag.appendChild(outer)
        frag.appendChild(document.createTextNode(' '))
      })
      spanEl.appendChild(frag)
      return [...spanEl.querySelectorAll('span > span')]
    }

    const wordsA = split(lineARef.current)
    const wordsB = split(lineBRef.current)
    gsap.set([...wordsA, ...wordsB], { yPercent: 120 })

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'center 45%',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        wordsA.forEach((w, i) => {
          const d = i * 0.05
          const prog = Math.max(0, Math.min(1, (p - d * 0.5) / (1 - d * 0.3)))
          gsap.set(w, { yPercent: 120 - prog * 120 })
        })
        wordsB.forEach((w, i) => {
          const d = i * 0.07
          const prog = Math.max(0, Math.min(1, (p - d * 0.5) / (1 - d * 0.3)))
          gsap.set(w, { yPercent: 120 - prog * 120, opacity: 0.3 + prog * 0.7 })
        })
      },
    })
    return () => st.kill()
  }, [ref])

  return (
    <section id="intro" ref={ref} className="relative z-[2] flex min-h-screen items-center px-6 md:px-16">
      <p className="display-xl text-white">
        <span ref={lineARef} className="block">
          WE CREATE DIGITAL
        </span>
        <span ref={lineBRef} className="block text-white/40">
          EXPERIENCES THAT FEEL ALIVE.
        </span>
      </p>
    </section>
  )
}