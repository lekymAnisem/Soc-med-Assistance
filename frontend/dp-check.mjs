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
    const s = document.getElementById('products')
    if (!s) return null
    return {
      hasHeader: /BUILT TO SCALE/.test(s.textContent),
      hasFilters: /All.*Strategy.*Product Design.*Engineering/.test(s.textContent),
      cardCount: s.querySelectorAll('article').length,
      hasObservability: /Observability/.test(s.textContent),
    }
  })
}
console.log('BEFORE FILTER:', JSON.stringify(info))
if (info) {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#products button')]
    const eng = btns.find((b) => b.textContent.includes('Engineering'))
    eng?.click()
  })
  await new Promise((r) => setTimeout(r, 800))
  const after = await page.evaluate(() => {
    const s = document.getElementById('products')
    return {
      cardCount: s.querySelectorAll('article').length,
      hasObservability: /Observability/.test(s.textContent),
    }
  })
  console.log('AFTER Engineering filter:', JSON.stringify(after))
}
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
