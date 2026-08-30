import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Word-by-word reveal driven by scroll. Each word sits in an overflow
 * hidden wrapper; words move up at slightly staggered speeds.
 */
export function animateSplitLines(root, selector = '[data-split]') {
  const items = root.querySelectorAll(selector)
  if (!items.length) return

  const words = (el) => {
    const text = el.textContent.trim()
    el.textContent = ''
    const frag = document.createDocumentFragment()
    text.split(' ').forEach((w, i) => {
      const span = document.createElement('span')
      span.className = 'inline-block overflow-hidden align-top'
      const inner = document.createElement('span')
      inner.className = 'inline-block will-change-transform'
      inner.textContent = w
      span.appendChild(inner)
      frag.appendChild(span)
      if (i < text.split(' ').length - 1) frag.appendChild(document.createTextNode(' '))
    })
    el.appendChild(frag)
    return [...el.querySelectorAll('span > span')]
  }

  items.forEach((el) => {
    const innerSpans = words(el)
    gsap.set(el, { opacity: 1 })
    gsap.set(innerSpans, { yPercent: 120, opacity: 0.35 })

    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      end: 'top 30%',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress
        innerSpans.forEach((s, i) => {
          const delay = i * 0.06
          const prog = Math.max(0, Math.min(1, (p - delay * 0.6) / (1 - delay * 0.4)))
          gsap.set(s, { yPercent: 120 - prog * 120, opacity: 0.35 + prog * 0.65 })
        })
      },
    })
  })
}

/**
 * Generic fade/slide-up on scroll into view (once).
 */
export function fadeUp(target, start = 'top 88%') {
  return gsap.fromTo(
    target,
    { y: 60, opacity: 0, filter: 'blur(6px)' },
    {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: target, start, once: true },
    }
  )
}

/**
 * Parallax: element moves slower/faster than scroll.
 */
export function parallax(target, { speed = -0.15, start = 'top bottom', end = 'bottom top' } = {}) {
  return gsap.fromTo(
    target,
    { yPercent: 0 },
    {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: { trigger: target, start, end, scrub: 1.2 },
    }
  )
}

export function cleanup(gsapCtxs = []) {
  gsapCtxs.forEach((c) => c && c.revert())
  ScrollTrigger.getAll().forEach((st) => st.kill())
}
