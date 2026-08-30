import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
for (const t of [3000, 6000, 9000]) {
  await new Promise((r) => setTimeout(r, t === 3000 ? 3000 : 3000))
  const s = await page.evaluate(() => ({
    hasHero: !!document.getElementById('hero'),
    scrollHeight: document.documentElement.scrollHeight,
    bodyStart: document.body.innerText.slice(0, 60).replace(/\n/g, ' | '),
    loaderVisible: !!document.querySelector('.fixed.inset-0.z-\\[10000\\]'),
  }))
  console.log(`t=${t}ms:`, JSON.stringify(s))
}
console.log('ERRORS:', errors.length ? errors.slice(0, 8).join('\n') : 'none')
await browser.close()
