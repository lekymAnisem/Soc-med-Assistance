import { v2 as cloudinary } from 'cloudinary'
import { MEDIA_PLATFORMS, type MediaPlatform } from '../media/platforms.js'

/**
 * Cloudinary media storage + on-the-fly transformation.
 *
 * The original upload lives on Cloudinary; per-platform sizes are
 * delivered as transformation URLs (crop-fill + smart gravity), so no
 * local video/image processing is needed at request time.
 */

export function getCloudinary(): typeof cloudinary | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
  return cloudinary
}

export interface CloudinaryUpload {
  publicId: string
  url: string
  secureUrl: string
}

/** Upload a file (image or video) to Cloudinary. */
export function uploadToCloudinary(
  filePath: string,
  resourceType: 'image' | 'video',
  folder: string
): Promise<CloudinaryUpload> {
  const client = getCloudinary()
  if (!client) {
    return Promise.reject(
      new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to database/.env.')
    )
  }

  return new Promise((resolve, reject) => {
    client.uploader.upload(
      filePath,
      {
        folder,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: false,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }
        resolve({ publicId: result.public_id, url: result.url, secureUrl: result.secure_url })
      }
    )
  })
}

/**
 * Build the transformed delivery URL for a platform-specific crop.
 * Uses `c_fill` with `g_auto` so faces/subjects stay centered.
 */
export function platformMediaUrl(
  publicId: string,
  resourceType: 'image' | 'video',
  platform: MediaPlatform
): string {
  const client = getCloudinary()
  if (!client) throw new Error('Cloudinary is not configured.')

  const spec = MEDIA_PLATFORMS[platform]
  return client.url(publicId, {
    resource_type: resourceType,
    secure: true,
    transformation: [
      { width: spec.w, height: spec.h, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  })
}
