import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useLenis } from '../SmoothScroll/SmoothScroll'

export default function Contact() {
  const root = useRef(null)
  const title = useRef(null)
  const cta = useRef(null)
  const { scrollTo } = useLenis() || {}

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        title.current,
        { opacity: 0, y: 100, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.4,
          ease: 'power4.out',
          scrollTrigger: { trigger: root.current, start: 'top 70%', once: true },
        }
      )
      gsap.fromTo(
        cta.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.4,
          scrollTrigger: { trigger: root.current, start: 'top 55%', once: true },
        }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  const onCtaMove = (e) => {
    const el = cta.current
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5
    gsap.to(el, { x: relX * 24, y: relY * 16, duration: 0.6, ease: 'power3.out' })
  }
  const onCtaLeave = () => {
    gsap.to(cta.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
  }

  const goTop = () => {
    if (scrollTo) scrollTo(0, { duration: 1.8 })
  }

  return (
    <section
      id="contact"
      ref={root}
      className="relative z-[2] flex min-h-screen flex-col items-center justify-center px-6 py-28 text-center"
    >
      <p className="eyebrow mb-8">Start a project</p>

      <h2 ref={title} className="display-mega text-white">
        LET&rsquo;S CREATE
        <br />
        SOMETHING
        <br />
        UNEXPECTED<span className="text-[#d8ff3e]">.</span>
      </h2>

      <button
        ref={cta}
        data-cursor="project"
        data-cursor-text="HELLO"
        className="mt-16 inline-flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/70 transition-colors hover:text-[#d8ff3e]"
        onMouseMove={onCtaMove}
        onMouseLeave={onCtaLeave}
        onClick={() => {
          window.location.href = 'mailto:hello@nova.studio'
        }}
      >
        START A PROJECT
        <span className="inline-block transition-transform duration-500 ease-out group-hover:translate-x-2">→</span>
      </button>

      <button
        onClick={goTop}
        className="mt-20 font-mono text-[9px] uppercase tracking-[0.35em] text-white/30 transition-colors hover:text-white"
      >
        Back to top ↑
      </button>

      <div className="absolute bottom-8 left-6 flex flex-col gap-1 text-left font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 md:left-16">
        <span>NOVA — CREATIVE TECHNOLOGY STUDIO</span>
        <span>HELLO@NOVA.STUDIO</span>
      </div>
    </section>
  )
}