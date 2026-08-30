import { motion } from 'framer-motion'
import { useLenis } from '../SmoothScroll/SmoothScroll'
import Hero3DScene from './Hero3DScene'

const EASE = [0.16, 1, 0.3, 1]

export default function Hero() {
  const { scrollTo } = useLenis() || {}
  const go = (id) => scrollTo?.(`#${id}`, { offset: 0 })

  return (
    <section
      id="hero"
      className="relative z-[2] flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* custom 3D scene — content network */}
      <Hero3DScene />

      {/* content overlay */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d8ff3e]" />
            AI Content Repurposing Engine
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="display-mega text-white"
        >
          <span className="block">ONE SOURCE.</span>
          <span className="block">EVERY PLATFORM.</span>
          <span className="block gradient-text">AI-POWERED.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          className="mx-auto mt-8 max-w-xl text-base font-light leading-relaxed text-white/45 md:text-lg"
        >
          Upload a video or article once. Our AI rewrites, resizes and
          reformats it into ready-to-post content for every social platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
          className="pointer-events-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button
            data-cursor="link"
            onClick={() => go('studio')}
            className="group inline-flex items-center gap-2 bg-[#d8ff3e] px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] text-black transition-all duration-300 hover:scale-105 hover:bg-white"
          >
            Start Repurposing
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
          <button
            data-cursor="link"
            onClick={() => go('work')}
            className="inline-flex items-center gap-2 border border-white/20 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-white/60 hover:text-white"
          >
            See It in Action
          </button>
        </motion.div>

        {/* platform chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="pointer-events-none mt-12 flex flex-wrap items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30"
        >
          {['LinkedIn', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'X'].map((p) => (
            <span key={p} className="border border-white/10 px-3 py-1.5">
              {p}
            </span>
          ))}
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <button
          data-cursor="link"
          onClick={() => go('intro')}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/40">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </button>
      </motion.div>
    </section>
  )
}