import { forwardRef, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight,
  Target,
  PenTool,
  Wrench,
  Layers,
  X,
  Zap,
  Shield,
  Gauge,
  Boxes,
  CircuitBoard,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types & data                                                        */
/* ------------------------------------------------------------------ */

type Category = 'strategy' | 'design' | 'engineering'
type GraphicType = 'bars' | 'orbit' | 'grid' | 'wave' | 'pulse'

interface Product {
  id: string
  title: string
  description: string
  category: Category[]
  tags: ('Strategy' | 'Design' | 'Engineering')[]
  metrics: { label: string; icon: typeof Zap }[]
  span: string
  graphic: GraphicType
  accent: string
}

const PRODUCTS: Product[] = [
  {
    id: 'observability',
    title: 'Cloud Observability Dashboard',
    description:
      'A real-time telemetry surface that turns billions of metrics into answers — with sub-second alerting and drill-down analytics.',
    category: ['engineering', 'design'],
    tags: ['Design', 'Engineering'],
    metrics: [
      { label: '10M+ Events / Day', icon: Gauge },
      { label: 'Sub-50ms Query Latency', icon: Zap },
      { label: 'Zero-Downtime Rollouts', icon: Shield },
    ],
    span: 'lg:col-span-2 lg:row-span-2',
    graphic: 'bars',
    accent: '#818cf8',
  },
  {
    id: 'gateway',
    title: 'Fintech Payment Gateway',
    description:
      'A settlement engine engineered for trust — idempotent, audited, and fault-tolerant across global rails.',
    category: ['strategy', 'engineering'],
    tags: ['Strategy', 'Engineering'],
    metrics: [
      { label: '$2B+ Processed', icon: Shield },
      { label: '99.99% Uptime', icon: Zap },
      { label: 'PCI-DSS Compliant', icon: Layers },
    ],
    span: 'lg:col-span-1 lg:row-span-1',
    graphic: 'orbit',
    accent: '#34d399',
  },
  {
    id: 'design-system',
    title: 'Design System UI Kit',
    description:
      'A token-driven component library that keeps 40+ product surfaces visually and behaviorally coherent.',
    category: ['design'],
    tags: ['Design'],
    metrics: [
      { label: '120+ Components', icon: Boxes },
      { label: 'WCAG 2.2 AA', icon: Layers },
      { label: 'Zero Design Debt', icon: Target },
    ],
    span: 'lg:col-span-1 lg:row-span-1',
    graphic: 'grid',
    accent: '#f472b6',
  },
  {
    id: 'analytics',
    title: 'Growth Analytics Platform',
    description:
      'Funnel intelligence with multi-tenant isolation — experiment-driven product decisions at every layer.',
    category: ['strategy', 'design'],
    tags: ['Strategy', 'Design'],
    metrics: [
      { label: '1.4B Data Points', icon: Gauge },
      { label: 'Real-Time Funnels', icon: Zap },
      { label: 'Multi-Tenant Isolation', icon: Shield },
    ],
    span: 'lg:col-span-1 lg:row-span-1',
    graphic: 'wave',
    accent: '#38bdf8',
  },
  {
    id: 'testing',
    title: 'Autonomous Testing Engine',
    description:
      'A self-healing QA harness that ships flake-free — generated, executed and reported entirely by the platform.',
    category: ['engineering'],
    tags: ['Engineering'],
    metrics: [
      { label: '15K Tests / Min', icon: CircuitBoard },
      { label: '98% Flake Elimination', icon: Target },
      { label: 'CI/CD Native', icon: Wrench },
    ],
    span: 'lg:col-span-1 lg:row-span-1',
    graphic: 'pulse',
    accent: '#fbbf24',
  },
]

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'design', label: 'Product Design' },
  { id: 'engineering', label: 'Engineering' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

/* ------------------------------------------------------------------ */
/* Abstract product graphics                                           */
/* ------------------------------------------------------------------ */

function ProductGraphic({ type, accent }: { type: GraphicType; accent: string }) {
  switch (type) {
    case 'bars':
      return <BarsGraphic accent={accent} />
    case 'orbit':
      return <OrbitGraphic accent={accent} />
    case 'grid':
      return <GridGraphic accent={accent} />
    case 'wave':
      return <WaveGraphic accent={accent} />
    case 'pulse':
      return <PulseGraphic accent={accent} />
    default:
      return null
  }
}

function BarsGraphic({ accent }: { accent: string }) {
  const heights = [34, 58, 44, 76, 52, 90, 66]
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <defs>
        <linearGradient id="bars-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0.1" />
          <stop offset="1" stopColor={accent} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <motion.rect
          key={i}
          x={14 + i * 27}
          y={112 - h}
          width={16}
          height={h}
          rx={3}
          fill={`url(#bars-grad)`}
          initial={{ opacity: 0.25, scaleY: 0.6 }}
          animate={{ opacity: [0.4, 1, 0.4], scaleY: [1, 1.04, 1] }}
          transition={{ duration: 3, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
      <motion.line
        x1="10" y1="60" x2="190" y2="60"
        stroke={accent} strokeWidth="1" strokeDasharray="4 6" opacity="0.4"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
    </svg>
  )
}

function OrbitGraphic({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <circle cx="100" cy="60" r="36" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="100" cy="60" r="24" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="100" cy="60" r="6" fill={accent} opacity="0.8" />
      <motion.circle
        cx="100" cy="60" r="3" fill={accent}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '100px', originY: '60px' }}
      >
        <circle cx="136" cy="60" r="4" fill={accent} opacity="0.9" />
      </motion.g>
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '100px', originY: '60px' }}
      >
        <circle cx="76" cy="60" r="3" fill="#e2e8f0" opacity="0.6" />
      </motion.g>
    </svg>
  )
}

function GridGraphic({ accent }: { accent: string }) {
  const nodes = [
    [20, 20], [100, 16], [180, 26], [36, 70], [110, 72], [170, 90], [70, 104], [150, 40],
  ]
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      {nodes.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x} cy={y} r={3}
          fill={i % 3 === 0 ? accent : '#94a3b8'}
          opacity="0.7"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
      {nodes.map(([x, y], i) => {
        const next = nodes[(i + 1) % nodes.length]
        return (
          <line key={`l${i}`} x1={x} y1={y} x2={next[0]} y2={next[1]} stroke="#475569" strokeOpacity="0.3" strokeWidth="1" />
        )
      })}
    </svg>
  )
}

function WaveGraphic({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <defs>
        <linearGradient id="wave-fill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0.05" />
          <stop offset="1" stopColor={accent} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M0 60 Q 25 30 50 60 T 100 60 T 150 60 T 200 60 L200 120 L0 120 Z" fill="url(#wave-fill)" />
      <motion.line
        x1="0" y1="60" x2="200" y2="60" stroke={accent} strokeWidth="1.5" strokeDasharray="3 5"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
      />
      <motion.g
        animate={{ x: [0, 200, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="0" cy="60" r="3" fill={accent} />
      </motion.g>
    </svg>
  )
}

function PulseGraphic({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <motion.path
        d="M0 60 H55 L70 30 L95 95 L115 45 L130 60 H200"
        fill="none" stroke={accent} strokeWidth="2"
        animate={{ strokeDashoffset: [200, -200] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        strokeDasharray="8 6"
      />
      <motion.line
        x1="0" y1="60" x2="200" y2="60" stroke="#334155" strokeOpacity="0.4" strokeWidth="1"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <motion.circle
        cx="115" cy="45" r="4" fill={accent}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Product card                                                        */
/* ------------------------------------------------------------------ */

function ProductCardBase({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }, ref: React.ForwardedRef<HTMLElement>) {
  const [hovered, setHovered] = useState(false)
  const CatIcon = product.category.includes('strategy')
    ? Target
    : product.category.includes('design')
      ? PenTool
      : Wrench

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onOpen(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-cursor="link"
      className={`group relative cursor-pointer overflow-hidden border border-white/10 bg-white/[0.02] p-6 transition-colors duration-500 hover:border-white/30 ${product.span}`}
    >
      {/* accent corner */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-40"
        style={{ background: `radial-gradient(circle at top right, ${product.accent}33, transparent 70%)` }}
      />

      <motion.div
        animate={{ scale: hovered ? 1.035 : 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-full flex-col"
      >
        {/* graphic area */}
        <div className="relative mb-5 h-28 w-full overflow-hidden rounded-sm border border-white/5 bg-black/30 md:h-32">
          <ProductGraphic type={product.graphic} accent={product.accent} />
          <div className="absolute left-2 top-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            <CatIcon size={10} style={{ color: product.accent }} />
            {product.category.join(' / ')}
          </div>
        </div>

        {/* title */}
        <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-white">{product.title}</h3>
        <p className="mt-2 max-w-md text-xs font-light leading-relaxed text-white/45">{product.description}</p>

        <div className="mt-auto flex items-center gap-2 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          <ArrowUpRight size={11} style={{ color: product.accent }} />
          Inspect product
        </div>
      </motion.div>

      {/* hover overlay — slides up revealing tags + metrics */}
      <motion.div
        animate={{ y: hovered ? 0 : '110%' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex flex-col justify-end p-6"
        style={{ background: `linear-gradient(to top, rgba(2,6,23,0.98), rgba(2,6,23,0.92) 60%, ${product.accent}14)` }}
      >
        <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: product.accent }}>
          Scale with Intention
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.tags.map((t) => (
            <span key={t} className="border border-white/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-white/70">
              {t}
            </span>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {product.metrics.slice(0, 3).map((m) => (
            <li key={m.label} className="flex items-center gap-2 font-mono text-[10px] text-white/75">
              <m.icon size={11} style={{ color: product.accent }} />
              {m.label}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.article>
  )
}

const ProductCard = forwardRef(ProductCardBase)

/* ------------------------------------------------------------------ */
/* Detail modal                                                        */
/* ------------------------------------------------------------------ */

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg border border-white/15 bg-[#05060a] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              data-cursor="link"
              className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="mb-5 h-32 overflow-hidden rounded-sm border border-white/5 bg-black/40">
              <ProductGraphic type={product.graphic} accent={product.accent} />
            </div>

            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: product.accent }}>
              {product.category.join(' / ')}
            </div>
            <h3 className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-white">{product.title}</h3>
            <p className="mt-3 text-sm font-light leading-relaxed text-white/55">{product.description}</p>

            <div className="mt-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">Scale Metrics</p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {product.metrics.map((m) => (
                  <li key={m.label} className="border border-white/10 bg-white/[0.02] p-3">
                    <m.icon size={13} style={{ color: product.accent }} />
                    <p className="mt-2 font-mono text-[10px] leading-snug text-white/80">{m.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function DigitalProducts() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [modal, setModal] = useState<Product | null>(null)

  const filtered = useMemo(
    () =>
      filter === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category.includes(filter as Category)),
    [filter]
  )

  return (
    <section id="products" className="relative z-[2] px-6 py-28 md:px-16 md:py-40">
      {/* header */}
      <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Digital Products</p>
          <h2 className="display-lg mt-2 text-white">
            BUILT TO
            <span className="gradient-text"> SCALE</span>
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-white/45">
            Strategy, product design and engineering for tools and platforms
            designed to scale with intention.
          </p>
        </div>

        {/* filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              data-cursor="link"
              onClick={() => setFilter(f.id)}
              className={`border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-all duration-300 ${
                filter === f.id
                  ? 'border-[#818cf8] bg-[#818cf8]/10 text-[#818cf8]'
                  : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* bento grid */}
      <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[230px]">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={setModal} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* modal */}
      <ProductModal product={modal} onClose={() => setModal(null)} />
    </section>
  )
}
