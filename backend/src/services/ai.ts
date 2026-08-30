import OpenAI from 'openai'
import type { Platform } from '../types.js'
import { MEDIA_PLATFORMS, type MediaKind, type MediaPlatform } from '../media/platforms.js'

/**
 * AI Content Repurposing Service.
 * Takes long-form source text + a target platform, constructs a
 * platform-specific prompt, calls the LLM via OpenRouter, and returns
 * the result.
 *
 * OpenRouter exposes an OpenAI-compatible API, so we use the OpenAI SDK
 * pointed at OpenRouter's base URL. A single model id (e.g.
 * `nvidia/nemotron-3-super-120b-a12b:free`) routes to the underlying model.
 *
 * The client is created lazily so the API server can boot (health check)
 * before the API key is configured.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

/** Which AI gateway to use: 'openrouter' (default) or 'openai'. */
const PROVIDER = process.env.AI_PROVIDER ?? 'openrouter'

let cachedClient: OpenAI | null = null

function getClient(): OpenAI {
  if (!cachedClient) {
    if (PROVIDER === 'openrouter') {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error(
          'OPENROUTER_API_KEY is not set. Copy backend/.env.example to backend/.env and add your OpenRouter key.'
        )
      }
      cachedClient = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          'HTTP-Referer': process.env.SITE_URL ?? 'http://localhost:4000',
          'X-Title': 'Nova Repurposer API',
        },
      })
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          'OPENAI_API_KEY is not set. Copy backend/.env.example to backend/.env and add your OpenAI key.'
        )
      }
      cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
  }
  return cachedClient
}

function getModel(): string {
  return PROVIDER === 'openrouter'
    ? (process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b:free')
    : (process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
}

interface PlatformPrompt {
  /** System instruction setting role + editorial rules for the model. */
  system: string
  /** User message builder injecting the source content. */
  buildUserMessage: (sourceText: string) => string
}

const PROMPTS: Record<Platform, PlatformPrompt> = {
  linkedin: {
    system:
      'You are an expert LinkedIn content strategist. Rewrite the given source content into a single, engaging LinkedIn post. Use a strong hook in the first line, short punchy paragraphs, minimal hashtags (max 3), a clear point of view, and end with an open question to drive engagement. Do not use emojis excessively. Keep it under 1300 characters. Return only the post body.',
    buildUserMessage: (sourceText) =>
      `Source content to rewrite as a LinkedIn post:\n\n${sourceText}`,
  },
  newsletter: {
    system:
      'You are an experienced editorial newsletter writer. Rewrite the source content into a polished newsletter issue. Structure it with a compelling subject line on the first line, a brief greeting, a scannable body with clear sections, a call to action, and a short sign-off. Keep a warm but professional voice. Use Markdown for headings and emphasis. Return only the newsletter content.',
    buildUserMessage: (sourceText) =>
      `Source content to rewrite as a newsletter:\n\n${sourceText}`,
  },
  twitter: {
    system:
      'You are a sharp Twitter/X writer. Rewrite the source content as a threaded post. Split it into a hook tweet followed by numbered thread tweets (use "1/", "2/", etc. at the start of each). Each tweet must be under 280 characters, punchy and self-contained. End with a strong payoff or call to action. No hashtags. Return only the thread, tweets separated by blank lines.',
    buildUserMessage: (sourceText) =>
      `Source content to rewrite as a Twitter/X thread:\n\n${sourceText}`,
  },
  script: {
    system:
      'You are a video scriptwriter for a short-form video (60–90 seconds). Rewrite the source content into a tight spoken script. Format it with scene/visual cues in brackets on their own line, then the narration. Use a conversational, energetic tone suitable for voiceover. Include a hook in the first 3 seconds and a clear call to action at the end. Return only the script.',
    buildUserMessage: (sourceText) =>
      `Source content to rewrite as a short-form video script:\n\n${sourceText}`,
  },
}

/**
 * Repurpose long-form source text into a post for the given platform.
 * @throws if the API key is missing, the API call fails, or no content is returned.
 */
export async function repurposeContent(
  sourceText: string,
  platform: Platform
): Promise<string> {
  const prompt = PROMPTS[platform]
  if (!prompt) {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  const client = getClient()

  const completion = await client.chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.buildUserMessage(sourceText) },
    ],
    temperature: 0.7,
    max_tokens: 1200,
  })

  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) {
    throw new Error(`AI returned empty content for platform: ${platform}`)
  }

  return content
}

/**
 * Generate a ready-to-post social media caption for the given platform.
 * Uses the user's optional context; when omitted the model writes a
 * generic-but-platform-appropriate caption for the media type.
 */
export async function generateSocialCaption(input: {
  platform: MediaPlatform
  mediaKind: MediaKind
  context?: string
}): Promise<string> {
  const spec = MEDIA_PLATFORMS[input.platform]
  const client = getClient()

  const rules: Record<string, string> = {
    hashtags:
      'End with 8-10 highly relevant hashtags on separate lines. Keep the tone warm and engaging. Max 2200 characters.',
    casual:
      'Write a natural, friendly post caption. Max 400 characters. Use 1-2 relevant hashtags at the end.',
    professional:
      'Write a polished, professional caption that sounds human. Max 1300 characters. Use 2-3 relevant hashtags at the end.',
    punchy:
      'Write a punchy caption under 280 characters. No hashtags.',
    'title-description':
      'Write a YouTube title (line 1, max 100 chars) followed by a video description with a short hook, 3-5 key points, and 3-4 relevant hashtags.',
  }

  const hint = spec.captionHint ?? 'casual'
  const rule = rules[hint] ?? rules.casual

  const contextBlock = input.context?.trim()
    ? `The content is about: ${input.context.trim()}`
    : 'You do not have a description of the content. Write a versatile caption that works for a general video/image post.'

  const completion = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: 'system',
        content:
          'You are a top-tier social media copywriter. Write an original, engaging caption for the user\'s post. Never mention that content was AI-generated or repurposed. Return only the caption text.',
      },
      {
        role: 'user',
        content: `Create a ${spec.label} post caption. ${rule} ${contextBlock}. Media type: ${input.mediaKind}.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 700,
  })

  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) {
    throw new Error(`AI returned empty caption for platform: ${input.platform}`)
  }
  return content
}
