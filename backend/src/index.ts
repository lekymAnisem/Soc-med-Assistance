import dotenv from 'dotenv'
import path from 'path'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import repurposeRouter from './routes/repurpose.js'
import mediaRouter from './routes/media.js'
import { metricsHandler, httpRequestsTotal, httpRequestDuration } from './metrics.js'
import { TMP_DIR } from './paths.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the backend .env (PORT, CORS, OPENAI_API_KEY, ...) first — existing
// vars are never overridden — then the database tier's .env (DATABASE_URL),
// so DB credentials live in one place (database/.env) for both migrations
// and the running API.
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../database/.env') })

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

// ensure storage directories exist
mkdirSync(TMP_DIR, { recursive: true })

const app = express()

// ── Middleware ─────────────────────────────────────────────────────

app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
)

app.use(express.json({ limit: '2mb' }))

// ── Metrics middleware ────────────────────────────────────────────
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ route: req.path })
  res.on('finish', () => {
    httpRequestsTotal.inc({ route: req.path, status: String(res.statusCode) })
    end()
  })
  next()
})

// ── Routes ────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/metrics', metricsHandler)

app.use('/api', repurposeRouter)
app.use('/api', mediaRouter)

// ── 404 ───────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ── Global error handler ──────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[unhandled]', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Boot ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`⚡ API server running at http://localhost:${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
})

export default app