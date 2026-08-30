/**
 * Social media platform specs — recommended output dimensions.
 * Used to crop/resize uploaded media to each platform's best format.
 */
export const MEDIA_PLATFORMS = {
  instagram: { label: 'Instagram', w: 1080, h: 1350, media: 'post', captionHint: 'hashtags' },
  facebook: { label: 'Facebook', w: 1200, h: 630, media: 'post', captionHint: 'casual' },
  linkedin: { label: 'LinkedIn', w: 1200, h: 627, media: 'post', captionHint: 'professional' },
  twitter: { label: 'Twitter / X', w: 1600, h: 900, media: 'post', captionHint: 'punchy' },
  youtube: { label: 'YouTube', w: 1280, h: 720, media: 'video', captionHint: 'title-description' },
  tiktok: { label: 'TikTok', w: 1080, h: 1920, media: 'video', captionHint: 'hashtags' },
} as const

export type MediaPlatform = keyof typeof MEDIA_PLATFORMS

export function isMediaPlatform(value: string): value is MediaPlatform {
  return value in MEDIA_PLATFORMS
}

export function platformList(): MediaPlatform[] {
  return Object.keys(MEDIA_PLATFORMS) as MediaPlatform[]
}

/** Content type of the uploaded file. */
export type MediaKind = 'image' | 'video'
