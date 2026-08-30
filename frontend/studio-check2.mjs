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
    const s = document.getElementById('studio-3d')
    if (!s) return null
    const input = s.querySelector('input[placeholder]')
    return {
      genPlaceholder: input?.getAttribute('placeholder') ?? null,
      generateBtn: !!s.querySelector('button') && /Generate/.test(s.textContent),
      canvas: !!s.querySelector('canvas'),
    }
  })
}
console.log('SECTION:', JSON.stringify(info))
// test generate flow
await page.evaluate(() => {
  const s = document.getElementById('studio-3d')
  const btn = [...s.querySelectorAll('button')].find((b) => b.textContent.includes('Generate'))
  btn?.click()
})
await new Promise((r) => setTimeout(r, 400))
const genState = await page.evaluate(() => {
  const s = document.getElementById('studio-3d')
  const btn = [...s.querySelectorAll('button')].find((b) => b.textContent.includes('Generating'))
  return { generatingLabel: btn?.textContent.trim() ?? null }
})
console.log('AFTER CLICK:', JSON.stringify(genState))
await new Promise((r) => setTimeout(r, 2600))
const afterGen = await page.evaluate(() => {
  const s = document.getElementById('studio-3d')
  const btn = [...s.querySelectorAll('button')].find((b) => b.textContent.includes('Generate'))
  return { backToGenerate: btn?.textContent.trim() ?? null }
})
console.log('AFTER 2.6s:', JSON.stringify(afterGen))
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
