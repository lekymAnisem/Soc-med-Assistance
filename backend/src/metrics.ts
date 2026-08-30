import client from 'prom-client'
import type { Request, Response } from 'express'

// Default Node/event-loop/process metrics, prefixed nova_ to match the
// Grafana dashboard that the monitoring server provisions.
client.collectDefaultMetrics({ prefix: 'nova_' })

export const httpRequestsTotal = new client.Counter({
  name: 'nova_http_requests_total',
  help: 'Total HTTP requests handled by the backend',
  labelNames: ['route', 'status'] as const,
})

export const httpRequestDuration = new client.Histogram({
  name: 'nova_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['route'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export async function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType)
  res.end(await client.register.metrics())
}
