import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Returns a normalized 0..1 progress of a DOM element passing
 * through the viewport (start → end are ScrollTrigger strings).
 */
export default function useSectionProgress({ start = 'top bottom', end = 'bottom top', onUpdate } = {}) {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      scrub: true,
      onUpdate: (self) => {
        setProgress(self.progress)
        onUpdate?.(self.progress)
      },
    })
    return () => st.kill()
  }, [start, end])

  return [ref, progress]
}
