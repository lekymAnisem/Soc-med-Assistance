import { useState, useEffect } from 'react'

/**
 * Returns a quality tier derived from device capability + user preference.
 *   'high' — desktop / powerful devices: full post-processing, many particles
 *   'med'  — large touch devices: reduced effects
 *   'low'  — mobile: minimal effects, few particles, no DOF/bloom chains
 */
export default function useDevicePerformance() {
  const [tier, setTier] = useState('high')
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const small = window.innerWidth < 768
    const isMobile = coarse || small

    let score = 0
    if (navigator.hardwareConcurrency) score += Math.min(navigator.hardwareConcurrency / 8, 1) * 2
    if (navigator.deviceMemory) score += Math.min(navigator.deviceMemory / 8, 1) * 2
    if (window.screen?.width && window.screen?.height) {
      const px = window.screen.width * window.screen.height
      if (px > 2500000) score += 2
      else if (px > 1200000) score += 1
    }
    score += isMobile ? -2 : 2

    let q = 'high'
    if (isMobile || reduced || score <= 2.5) q = 'low'
    else if (score <= 4.5) q = 'med'

    setIsTouch(isMobile)
    setTier(q)
  }, [])

  return { tier, isTouch }
}
