import { useEffect, useRef, useState } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import gsap from 'gsap'
import { useLenis } from '../SmoothScroll/SmoothScroll'

const LINKS = [
  { id: 'work', label: 'WORK', num: '01' },
  { id: 'lab', label: 'AI LAB', num: '02' },
  { id: 'futures', label: 'FUTURES', num: '03' },
  { id: 'products', label: 'PRODUCTS', num: '04' },
  { id: 'studio-3d', label: '3D STUDIO', num: '05' },
  { id: 'studio', label: 'UPLOAD', num: '06' },
  { id: 'services', label: 'CAPABILITIES', num: '07' },
  { id: 'about', label: 'ABOUT', num: '08' },
  { id: 'contact', label: 'CONTACT', num: '09' },
]

export default function Navigation({ visible }) {
  const navRef = useRef(null)
  const { scrollTo } = useLenis() || {}
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    gsap.set(navRef.current, { opacity: 0, y: -24 })
    const tl = gsap.to(navRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.2,
      paused: true,
    })
    if (visible) tl.play()
    else tl.reverse()
  }, [visible])

  const go = (id) => {
    setMenuOpen(false)
    if (scrollTo) scrollTo(`#${id}`, { offset: 0 })
  }

  const toggle = () => setMenuOpen((v) => !v)

  return (
    <>
      <header
        ref={navRef}
        className="fixed left-0 top-0 z-[80] flex w-full items-start justify-between px-6 py-5 mix-blend-difference md:px-10 md:py-8"
      >
        <button
          data-cursor="link"
          onClick={() => go('hero')}
          className="text-left"
          aria-label="Back to top"
        >
          <span className="font-mono text-[13px] tracking-[0.3em] text-white">NOVA</span>
          <span className="mt-1 block font-mono text-[8px] tracking-[0.35em] text-white/50">
            CREATIVE TECHNOLOGY
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              data-cursor="link"
              onClick={() => go(l.id)}
              className="group relative font-mono text-[11px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-white"
            >
              <span className="mr-1 text-[8px] text-white/30">{l.num}</span>
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
            </button>
          ))}

          {/* Clerk auth */}
          <div className="ml-2 flex items-center gap-4 border-l border-white/15 pl-8">
            <SignedOut>
              <SignInButton mode="modal" redirectUrl="/">
                <button
                  data-cursor="link"
                  className="group relative font-mono text-[11px] uppercase tracking-[0.25em] text-[#d8ff3e]/90 transition-colors hover:text-[#d8ff3e]"
                >
                  Sign In
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#d8ff3e] transition-all duration-500 ease-out group-hover:w-full" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2.5">
                <UserButton
                  appearance={{ elements: { avatarBox: { width: 26, height: 26 } } }}
                />
                <span className="hidden max-w-[140px] truncate font-mono text-[9px] uppercase tracking-[0.15em] text-white/40 xl:block">
                  {user?.primaryEmailAddress?.emailAddress ?? ''}
                </span>
              </div>
            </SignedIn>
          </div>
        </nav>

        <button
          data-cursor="link"
          onClick={toggle}
          className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? 'CLOSE' : 'MENU'}
        </button>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[#050505] transition-all duration-700 ease-out md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {LINKS.map((l, i) => (
          <button
            key={l.id}
            onClick={() => go(l.id)}
            className="display-lg flex items-baseline gap-3 text-white/90"
            style={{ transform: menuOpen ? 'none' : `translateY(${(i + 1) * 20}px)` }}
          >
            <span className="font-mono text-xs text-white/30">{l.num}</span>
            {l.label}
          </button>
        ))}
        {/* mobile auth */}
        <div className="mt-8" style={{ transform: menuOpen ? 'none' : `translateY(${170}px)` }}>
          <SignedOut>
            <SignInButton mode="modal" redirectUrl="/">
              <button data-cursor="link" className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#d8ff3e]">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">
              <UserButton />
              <span>{user?.primaryEmailAddress?.emailAddress ?? ''}</span>
            </div>
          </SignedIn>
        </div>
      </div>
    </>
  )
}
