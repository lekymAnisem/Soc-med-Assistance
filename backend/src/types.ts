/**
 * Shared domain types for the repurposing engine.
 */

export const PLATFORMS = ['linkedin', 'newsletter', 'twitter', 'script'] as const
export type Platform = (typeof PLATFORMS)[number]

export function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && (PLATFORMS as readonly string[]).includes(value)
}

/** Response body for a successfully repurposed source. */
export interface RepurposeResponse {
  source: {
    id: string
    originalUrl: string | null
    createdAt: string
  }
  posts: {
    platform: Platform
    content: string
  }[]
}
