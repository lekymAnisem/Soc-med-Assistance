import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb, users, sourceContent, generatedPosts } from '@nova/database'
import { repurposeContent } from '../services/ai.js'
import { isPlatform, PLATFORMS, type Platform, type RepurposeResponse } from '../types.js'

const router = Router()

// ── Request validation ─────────────────────────────────────────────

const bodySchema = z.object({
  email: z.string().email('A valid email address is required'),
  originalUrl: z.string().url().optional().nullable(),
  originalText: z.string().min(10, 'Source text must be at least 10 characters'),
  platforms: z
    .array(z.string())
    .min(1, 'At least one target platform is required')
    .refine((arr) => arr.every(isPlatform), {
      message: `Invalid platform. Supported: ${PLATFORMS.join(', ')}`,
    }),
})

/** Guard so unconfigured routes respond with a helpful 500. */
function dbOrError(res: Response) {
  try {
    return { db: getDb(), error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database is not configured'
    res.status(500).json({ error: message })
    return { db: null, error: message }
  }
}

// ── POST /api/repurpose ───────────────────────────────────────────

/**
 * Accept source content + target platforms, run the AI repurpose
 * pipeline, and return the generated posts.
 */
router.post('/repurpose', async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const { email, originalUrl, originalText, platforms } = parsed.data
  const platformsTyped = platforms as Platform[]

  const { db, error: dbError } = dbOrError(res)
  if (dbError || !db) return

  try {
    // 1. Find-or-create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      const [created] = await db
        .insert(users)
        .values({ email })
        .returning({ id: users.id, email: users.email, createdAt: users.createdAt })
      user = created
    }

    // 2. Persist the source input
    const [source] = await db
      .insert(sourceContent)
      .values({
        userId: user.id,
        originalUrl: originalUrl ?? null,
        originalText,
      })
      .returning({ id: sourceContent.id, createdAt: sourceContent.createdAt })

    // 3. Run AI calls for each selected platform (in parallel)
    const aiResults = await Promise.allSettled(
      platformsTyped.map((platform) => repurposeContent(originalText, platform))
    )

    // 4. Persist successful results; collect failures
    const posts: { platform: Platform; content: string }[] = []
    const errors: { platform: Platform; reason: string }[] = []

    for (let i = 0; i < platformsTyped.length; i++) {
      const platform = platformsTyped[i]
      const result = aiResults[i]

      if (result.status === 'fulfilled') {
        const content = result.value
        await db.insert(generatedPosts).values({
          sourceId: source.id,
          platform,
          contentText: content,
        })
        posts.push({ platform, content })
      } else {
        errors.push({
          platform,
          reason: result.reason instanceof Error ? result.reason.message : 'Unknown AI error',
        })
      }
    }

    // 5. Respond
    const response: RepurposeResponse = {
      source: {
        id: source.id,
        originalUrl: originalUrl ?? null,
        createdAt: source.createdAt.toISOString(),
      },
      posts,
    }

    // If all platforms failed, return 500
    if (posts.length === 0) {
      res.status(500).json({
        error: 'AI processing failed for all platforms',
        details: errors,
      })
      return
    }

    // Partial success: 200 with warnings
    if (errors.length > 0) {
      res.status(200).json({
        ...response,
        warnings: errors,
      })
      return
    }

    res.status(200).json(response)
  } catch (err) {
    console.error('[repurpose]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── GET /api/posts  (bonus: read back saved posts) ────────────────

router.get('/posts', async (req: Request, res: Response) => {
  const sourceId = req.query.sourceId as string | undefined

  if (!sourceId) {
    res.status(400).json({ error: 'Query parameter ?sourceId= is required' })
    return
  }

  const { db, error: dbError } = dbOrError(res)
  if (dbError || !db) return

  try {
    const rows = await db
      .select()
      .from(generatedPosts)
      .where(eq(generatedPosts.sourceId, sourceId))
      .orderBy(generatedPosts.platform)

    res.json(rows)
  } catch (err) {
    console.error('[get-posts]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router