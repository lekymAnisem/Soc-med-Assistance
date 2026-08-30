import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { createArtwork } from '../../utils/artwork'
import ShaderImage from './ShaderImage'

export default function ProjectCard({ project, active, dimmed, desktop }) {
  const root = useRef(null)
  const titleRef = useRef(null)
  const previewRef = useRef(null)
  const infoRef = useRef(null)
  // generated synchronously so the article renders on the very first pass and
  // all effects (entrance + hover) run against real refs.
  const [imageUrl] = useState(() => createArtwork(project.seed, 480, 640))

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(root.current, { opacity: 0, y: 80 })
      gsap.to(root.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 88%', once: true },
      })
    }, root)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!desktop || !root.current) return
    const t = gsap.quickTo(titleRef.current, 'x', { duration: 0.8, ease: 'power3.out' })
    const p = gsap.quickTo(previewRef.current, 'x', { duration: 0.9, ease: 'power3.out' })
    const s = gsap.quickTo(previewRef.current, 'scale', { duration: 0.7, ease: 'power3.out' })
    const r = gsap.quickTo(previewRef.current, 'rotation', { duration: 0.7, ease: 'power3.out' })

    const onMove = (e) => {
      const rect = root.current.getBoundingClientRect()
      const rel = (e.clientX - rect.left) / rect.width - 0.5
      t(rel * 40)
      p(rel * 30)
      s(1 + Math.abs(rel) * 0.06)
      r(rel * 3)
    }
    root.current.addEventListener('mousemove', onMove)
    return () => root.current?.removeEventListener('mousemove', onMove)
  }, [desktop])

  useEffect(() => {
    if (!desktop) return
    const p = previewRef.current
    const info = infoRef.current
    if (active) {
      gsap.to(p, { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: 'power3.out' })
      gsap.to(info, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 })
      gsap.to(root.current, { backgroundColor: 'rgba(255,255,255,0.02)', duration: 0.5 })
    } else {
      gsap.to(p, { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.out' })
      gsap.to(info, { opacity: 0, y: 8, duration: 0.4, ease: 'power2.out' })
      gsap.to(root.current, { backgroundColor: 'rgba(255,255,255,0)', duration: 0.5 })
    }
  }, [active, desktop])

  if (!imageUrl) return null

  return (
    <article
      ref={root}
      data-cursor="project"
      data-cursor-text={desktop ? 'OPEN' : ''}
      className={`group relative border-b border-white/10 px-6 py-10 transition-opacity duration-500 md:px-16 md:py-16 ${
        dimmed ? 'opacity-30' : 'opacity-100'
      } ${active ? 'bg-white/[0.02]' : ''}`}
    >
      <div className="relative flex items-center gap-6 md:gap-12">
        <span className="font-mono text-xs text-white/30 md:text-sm">{project.num}</span>

        <div className="flex-1">
          <h3
            ref={titleRef}
            className="display-lg text-white transition-transform duration-500 ease-out group-hover:translate-x-3 md:group-hover:translate-x-6"
          >
            {project.title}
          </h3>
          <div className="mt-2 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            <span>{project.category}</span>
            <span className="text-white/20">/</span>
            <span>{project.year}</span>
          </div>
        </div>

        {desktop && (
          <div
            ref={previewRef}
            className="pointer-events-none absolute right-8 top-1/2 z-10 w-[240px] opacity-0 md:w-[300px]"
            style={{ transform: 'translateY(-50%) scale(0.9)' }}
          >
            <div className="aspect-[3/4] overflow-hidden rounded-sm">
              <ShaderImage src={imageUrl} active={active} />
            </div>
          </div>
        )}
      </div>

      <p
        ref={infoRef}
        className="mt-4 max-w-md text-sm font-light leading-relaxed text-white/50 opacity-0 md:ml-16"
        style={{ transform: 'translateY(8px)' }}
      >
        {project.description}
      </p>

      {!desktop && (
        <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-sm">
          <img src={imageUrl} alt={project.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
    </article>
  )
}