import { useRef, useState } from 'react'
import gsap from 'gsap'

const SERVICES = [
  {
    num: '01',
    title: 'CREATIVE DEVELOPMENT',
    desc: 'Design-engineered websites, award-grade interfaces and interaction systems built to be felt, not just seen.',
  },
  {
    num: '02',
    title: 'AI EXPERIENCES',
    desc: 'Generative interfaces, agents and content systems that put artificial intelligence at the heart of the experience.',
  },
  {
    num: '03',
    title: '3D INTERACTION',
    desc: 'Spatial worlds, real-time 3D and motion systems that make digital environments feel physical and alive.',
  },
  {
    num: '04',
    title: 'WEBGL EXPERIMENTS',
    desc: 'Shader research, particle systems and rendering R&D for brands that want to push the browser further.',
  },
  {
    num: '05',
    title: 'DIGITAL PRODUCTS',
    desc: 'Strategy, product design and engineering for tools and platforms designed to scale with intention.',
  },
]

export default function Services() {
  const root = useRef(null)
  const [active, setActive] = useState(null)

  const onEnter = (i) => {
    setActive(i)
    gsap.to(root.current.querySelectorAll('.svc-item'), {
      opacity: (idx) => (idx === i ? 1 : 0.25),
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  const onLeave = () => {
    setActive(null)
    gsap.to(root.current.querySelectorAll('.svc-item'), {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  return (
    <section id="services" ref={root} className="relative z-[2] px-6 py-28 md:px-16 md:py-40">
      <h2 className="eyebrow mb-14 md:mb-20">Capabilities</h2>

      <div>
        {SERVICES.map((s, i) => (
          <div
            key={s.num}
            className="svc-item group border-t border-white/10 py-6 last:border-b md:py-9"
            data-cursor={active === i ? 'text' : 'link'}
            onMouseEnter={() => onEnter(i)}
            onMouseLeave={onLeave}
          >
            <div className="flex items-center gap-6 md:gap-10">
              <span className="font-mono text-xs text-white/30">{s.num}</span>
              <h3
                className={`display-lg text-white transition-all duration-500 ease-out ${
                  active === i ? 'translate-x-4 text-[#d8ff3e] md:translate-x-8' : ''
                }`}
              >
                {s.title}
              </h3>
            </div>

            <div
              className={`grid grid-rows-[0fr] transition-all duration-500 ease-out ${
                active === i ? 'grid-rows-[1fr]' : ''
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-lg pl-10 pt-4 text-sm font-light leading-relaxed text-white/50 md:pl-20 md:text-base">
                  {s.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}