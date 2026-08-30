import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise((r) => setTimeout(r, 6000))

const checks = { WORK: 'work', CAPABILITIES: 'services', EXPERIMENTS: 'ai', ABOUT: 'about', CONTACT: 'contact', NOVA: 'hero' }
for (const [label, id] of Object.entries(checks)) {
  await page.evaluate((lbl) => {
    const btns = [...document.querySelectorAll('button')]
    const btn = btns.find((b) => b.textContent.includes(lbl) && b.offsetParent !== null)
    btn?.click()
  }, label)
  await new Promise((r) => setTimeout(r, 2000))
  const pos = await page.evaluate((sid) => {
    const el = document.getElementById(sid)
    return { scrollY: Math.round(window.scrollY), targetY: el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null }
  }, id)
  const ok = pos.targetY !== null && Math.abs(pos.scrollY - pos.targetY) < 40
  console.log(`${label} -> ${id}: ${ok ? '✓ OK' : '✗ MISMATCH'} (scrollY=${pos.scrollY}, target=${pos.targetY})`)
}
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
await browser.close()
