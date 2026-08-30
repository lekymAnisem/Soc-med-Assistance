import 'dotenv/config'
import { repurposeContent } from './dist/services/ai.js'

const text = 'Artificial intelligence is transforming how creative teams work. It automates repetitive tasks, generates ideas at scale, and lets humans focus on strategy. At our studio we have built tools that turn long-form research into publishable content across every channel in minutes, not days.'

try {
  const linkedin = await repurposeContent(text, 'linkedin')
  console.log('=== LINKEDIN RESULT ===')
  console.log(linkedin)
  console.log('\n=== SUCCESS ✓ OpenRouter call works ===')
} catch (err) {
  console.error('=== FAILURE ===')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
