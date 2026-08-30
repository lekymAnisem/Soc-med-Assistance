import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
let info = null
for (let i = 0; i < 25 && !info; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  info = await page.evaluate(() => {
    const hero = document.getElementById('hero')
    if (!hero) return null
    const text = hero.textContent
    return {
      hasRepo: text.includes('Repurposing'),
      hasOneSource: text.includes('ONE SOURCE'),
      hasPlatforms: /LinkedIn/.test(text),
      canvasCount: hero.querySelectorAll('canvas').length,
    }
  })
}
console.log(JSON.stringify(info ?? 'hero never appeared', null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
