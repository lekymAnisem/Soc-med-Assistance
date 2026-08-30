import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import { unlink } from 'fs/promises'
import { MEDIA_PLATFORMS, isMediaPlatform, platformList } from '../media/platforms.js'
import { generateSocialCaption } from '../services/ai.js'
import { getCloudinary, uploadToCloudinary, platformMediaUrl } from '../services/cloudinary.js'
import type { MediaKind, MediaPlatform } from '../media/platforms.js'
import { TMP_DIR } from '../paths.js'

const router = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin'
      cb(null, `${crypto.randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = /^(image\/|video\/)/.test(file.mimetype)
    const extOk = /\.(png|jpe?g|gif|webp|avif|bmp|mp4|webm|mov|m4v|mkv)$/i.test(file.originalname)
    if (mimeOk || extOk) cb(null, true)
    else cb(new Error('Only image and video files are allowed'))
  },
})

function detectMediaKind(mime: string, filename: string): MediaKind | null {
  const imageExt = /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(filename)
  const videoExt = /\.(mp4|webm|mov|m4v|mkv)$/i.test(filename)
  if (mime.startsWith('image/') || imageExt) return 'image'
  if (mime.startsWith('video/') || videoExt) return 'video'
  return null
}

// ── POST /api/media/repurpose ─────────────────────────────────────

router.post(
  '/media/repurpose',
  (req: Request, res: Response, next: any) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large. Max 120 MB.' })
        return res.status(400).json({ error: err.message })
      }
      if (err) return res.status(400).json({ error: err.message })
      next()
    })
  },
  async (req: Request, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No file uploaded. Use form field name "file".' })
      return
    }

    // parse platforms
    let platformsRaw: string[] = []
    const p = req.body.platforms
    if (typeof p === 'string') {
      try { platformsRaw = JSON.parse(p) } catch { platformsRaw = p.split(',').map((s: string) => s.trim()) }
    } else if (Array.isArray(p)) {
      platformsRaw = p
    }

    const platforms = platformsRaw.filter(isMediaPlatform) as MediaPlatform[]
    if (platforms.length === 0) {
      await unlink(file.path).catch(() => {})
      res.status(400).json({ error: `At least one valid platform required. Supported: ${platformList().join(', ')}` })
      return
    }

    const context = (req.body.context as string) ?? ''

    const kind = detectMediaKind(file.mimetype, file.originalname)
    if (!kind) {
      await unlink(file.path).catch(() => {})
      res.status(400).json({ error: 'Unsupported file type. Upload a video (mp4, webm, mov) or image (jpg, png, webp).' })
      return
    }

    if (!getCloudinary()) {
      await unlink(file.path).catch(() => {})
      res.status(500).json({
        error: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to database/.env.',
      })
      return
    }

    const jobId = crypto.randomUUID()
    const folder = `nova/repurposed/${jobId}`

    try {
      // 1. upload original to Cloudinary
      const uploaded = await uploadToCloudinary(file.path, kind, folder)
      await unlink(file.path).catch(() => {})

      // 2. build per-platform transformed URLs
      const results: {
        platform: MediaPlatform
        label: string
        mediaUrl: string
        width: number
        height: number
        caption: string | null
        captionError: string | null
      }[] = platforms.map((platform) => {
        const spec = MEDIA_PLATFORMS[platform]
        return {
          platform,
          label: spec.label,
          mediaUrl: platformMediaUrl(uploaded.publicId, kind, platform),
          width: spec.w,
          height: spec.h,
          caption: null,
          captionError: null,
        }
      })

      // 3. generate captions in parallel
      const captionResults = await Promise.allSettled(
        platforms.map((platform) =>
          generateSocialCaption({ platform, mediaKind: kind, context })
        )
      )

      // 4. attach captions
      captionResults.forEach((r, i) => {
        results[i].caption = r.status === 'fulfilled' ? r.value : null
        results[i].captionError = r.status === 'rejected' ? (r.reason as Error).message : null
      })

      res.json({ jobId, kind, originalUrl: uploaded.secureUrl, results })
    } catch (err) {
      await unlink(file.path).catch(() => {})
      console.error('[media/repurpose]', err)
      res.status(500).json({ error: 'Media processing failed. Ensure the file is a valid video/image.' })
    }
  }
)

export default router