import { useEffect, useRef, createContext, useContext } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const LenisContext = createContext(null)
export const useLenis = () => useContext(LenisContext)

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  const api = {
    scrollTo: (target, opts = {}) =>
      lenisRef.current?.scrollTo(target, {
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        ...opts,
      }),
    stop: () => lenisRef.current?.stop(),
    start: () => lenisRef.current?.start(),
  }

  return <LenisContext.Provider value={api}>{children}</LenisContext.Provider>
}
