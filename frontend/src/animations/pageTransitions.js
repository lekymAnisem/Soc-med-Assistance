/**
 * Cinematic page transitions — the black veil that sweeps between
 * major sections, used on load and for experimental reveals.
 */
import gsap from 'gsap'

export const PAGE_EASE = 'expo.inOut'

export function revealVeil(el, onComplete) {
  const tl = gsap.timeline({ onComplete })
  tl.fromTo(el, { yPercent: 0 }, { yPercent: -100, duration: 1.2, ease: PAGE_EASE })
  return tl
}

export function hideVeil(el) {
  return gsap.fromTo(el, { yPercent: -100 }, { yPercent: 0, duration: 1.2, ease: PAGE_EASE })
}

/**
 * Clip-path wipe used for section entrance overlays.
 */
export function clipWipe(el, { direction = 'up' } = {}) {
  const start = direction === 'up' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)'
  return gsap.fromTo(
    el,
    { clipPath: start },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut' }
  )
}
