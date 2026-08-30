import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader --enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 8000))
const info = await page.evaluate(() => {
  const hero = document.getElementById('hero')
  return {
    heroExists: !!hero,
    canvasCount: hero?.querySelectorAll('canvas').length ?? 0,
    loadingText: hero?.textContent.includes('Loading 3D') ?? false,
    scrollText: hero?.textContent.includes('Scroll') ?? false,
    scrollHeight: document.documentElement.scrollHeight,
  }
}).catch((e) => ({ error: e.message }))
console.log(JSON.stringify(info, null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 5).join('\n') : 'none')
await browser.close()
