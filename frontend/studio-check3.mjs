import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
let ready = false
for (let i = 0; i < 25 && !ready; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  ready = await page.evaluate(() => !!document.getElementById('studio-3d'))
}
await new Promise((r) => setTimeout(r, 1000))
// click generate
await page.evaluate(() => {
  const s = document.getElementById('studio-3d')
  const btn = [...s.querySelectorAll('button')].find((b) => b.textContent.includes('Generate'))
  btn?.click()
})
await new Promise((r) => setTimeout(r, 4000))
const after = await page.evaluate(() => {
  const s = document.getElementById('studio-3d')
  const btns = [...s.querySelectorAll('button')]
  return {
    btnTexts: btns.map((b) => b.textContent.trim().slice(0, 40)),
    btnDisabled: btns.map((b) => b.disabled),
  }
})
console.log('BUTTONS:', JSON.stringify(after))
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
