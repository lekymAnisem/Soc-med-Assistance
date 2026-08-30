import { useState } from 'react'
import { projects } from '../../data/projects'
import ProjectCard from '../ProjectCard/ProjectCard'
import useSectionProgress from '../../hooks/useSectionProgress'
import useMediaQuery from '../../hooks/useMediaQuery'

export default function Projects() {
  const [active, setActive] = useState(null)
  const desktop = useMediaQuery('(pointer: fine) and (min-width: 768px)')
  const [ref, progress] = useSectionProgress({ start: 'top 70%', end: 'bottom 30%' })

  return (
    <section
      id="work"
      ref={ref}
      className="relative z-[2] px-0 pt-28 md:pt-40"
    >
      <div className="mb-10 flex items-end justify-between px-6 md:px-16">
        <h2 className="eyebrow">Selected Work</h2>
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/30">
          {String(Math.round(progress * 100)).padStart(3, '0')}%
        </span>
      </div>

      {projects.map((p) => (
        <div
          key={p.id}
          onMouseEnter={() => setActive(p.id)}
          onMouseLeave={() => setActive(null)}
        >
          <ProjectCard
            project={p}
            active={active === p.id}
            dimmed={active !== null && active !== p.id}
            desktop={desktop}
          />
        </div>
      ))}
    </section>
  )
}