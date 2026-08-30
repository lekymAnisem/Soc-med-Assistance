import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import DigitalWorld from './three/DigitalWorld'
import world from './utils/Store'
import LenisProvider from './components/SmoothScroll/SmoothScroll'
import CustomCursor from './components/CustomCursor/CustomCursor'
import Navigation from './components/Navigation/Navigation'
import Loader from './components/Loader/Loader'
import Home from './pages/Home'

gsap.registerPlugin(ScrollTrigger)

const CLERK_PK = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [quality, setQuality] = useState('high')
  const [isTouch, setIsTouch] = useState(false)

  // device capability detection
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const small = window.innerWidth < 768
    const mobile = coarse || small

    let score = 0
    if (navigator.hardwareConcurrency) score += Math.min(navigator.hardwareConcurrency / 8, 1) * 2
    if (navigator.deviceMemory) score += Math.min(navigator.deviceMemory / 8, 1) * 2
    if (window.screen?.width && window.screen?.height) {
      const px = window.screen.width * window.screen.height
      if (px > 2500000) score += 2
      else if (px > 1200000) score += 1
    }
    score += mobile ? -2 : 2

    let q = 'high'
    if (mobile || reduced || score <= 2.5) q = 'low'
    else if (score <= 4.5) q = 'med'

    setIsTouch(mobile)
    setQuality(q)
    world.set({ quality: q })
  }, [])

  // overall page scroll → world store
  useEffect(() => {
    if (!loaded) return
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => world.set({ scroll: self.progress }),
    })
    // content just mounted and grew the page — recalc all trigger positions
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 50)
    return () => {
      window.clearTimeout(t)
      st.kill()
    }
  }, [loaded])

  const onLoaderComplete = useCallback(() => {
    setLoaded(true)
    setNavVisible(true)
  }, [])

  if (!CLERK_PK) {
    console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set — auth disabled.')
  }

  return (
    <ClerkProvider publishableKey={CLERK_PK ?? 'pk_test_placeholder'}>
      {loaded && <DigitalWorld quality={quality} isTouch={isTouch} />}

      <div className="grain" />
      <div className="bg-blob bg-blob-a" aria-hidden />
      <div className="bg-blob bg-blob-b" aria-hidden />

      <Loader onComplete={onLoaderComplete} />

      <LenisProvider>
        {!isTouch && <CustomCursor />}
        <Navigation visible={navVisible} />
        {loaded && <Home />}
      </LenisProvider>
    </ClerkProvider>
  )
}