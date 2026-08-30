import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function About() {
  const root = useRef(null)
  const head = useRef(null)
  const body = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        head.current,
        { opacity: 0, y: 80, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
        }
      )
      gsap.fromTo(
        body.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.2,
          scrollTrigger: { trigger: root.current, start: 'top 70%', once: true },
        }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="about"
      ref={root}
      className="relative z-[2] grid min-h-screen grid-cols-1 items-center gap-10 px-6 py-28 md:grid-cols-12 md:px-16 md:py-40"
    >
      <div className="col-span-1 md:col-span-8">
        <h2 ref={head} className="display-xl text-white">
          WE DESIGN DIGITAL
          <br />
          EXPERIENCES FOR
          <br />
          THE FUTURE.
        </h2>
      </div>

      <div className="col-span-1 md:col-span-4 md:col-start-9 md:pt-40">
        <p ref={body} className="text-sm font-light leading-relaxed text-white/50">
          NOVA is an independent creative technology studio. We partner
          with ambitious brands and founders to design and build digital
          worlds — combining art direction, AI, real-time 3D and
          engineering craft.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          <div>
            <p className="mb-1 text-white/70">Location</p>
            <p>AMSTERDAM — TOKYO</p>
          </div>
          <div>
            <p className="mb-1 text-white/70">Founded</p>
            <p>2019</p>
          </div>
          <div>
            <p className="mb-1 text-white/70">Team</p>
            <p>14 CREATIVES</p>
          </div>
          <div>
            <p className="mb-1 text-white/70">Focus</p>
            <p>WEBGL / AI / 3D</p>
          </div>
        </div>
      </div>
    </section>
  )
}