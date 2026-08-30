import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = 'http://localhost:5173/'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('[console.error] ' + msg.text())
})
page.on('pageerror', (err) => errors.push('[pageerror] ' + err.message))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })

// wait for loader to finish and Home to render
await new Promise((r) => setTimeout(r, 4500))

const links = ['WORK', 'CAPABILITIES', 'EXPERIMENTS', 'ABOUT', 'CONTACT']
const results = []

for (const label of links) {
  const before = await page.evaluate(() => window.scrollY)
  const clicked = await page.evaluate((lbl) => {
    const btns = [...document.querySelectorAll('nav button')]
    const btn = btns.find((b) => b.textContent.includes(lbl))
    if (!btn) return 'NOT FOUND'
    btn.click()
    return 'clicked'
  }, label)
  await new Promise((r) => setTimeout(r, 1600))
  const after = await page.evaluate(() => window.scrollY)
  results.push({ label, clicked, before, after, moved: after !== before })
}

console.log('=== NAV CLICK RESULTS ===')
for (const r of results) console.log(`${r.label}: clicked=${r.clicked} scrollY ${r.before} -> ${r.after} ${r.moved ? '✓ MOVED' : '✗ NO MOVE'}`)
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')

await browser.close()
process.exit(errors.length ? 1 : 0)
