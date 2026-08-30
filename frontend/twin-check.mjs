import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)) })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
let info = null
for (let i = 0; i < 25 && !info; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  info = await page.evaluate(() => {
    const s = document.getElementById('futures')
    if (!s) return null
    return {
      hasCanvas: !!s.querySelector('canvas'),
      hasLayers: /Energy Grid.*Transit Flow.*Environmental/.test(s.textContent),
      hasScenarios: /Nominal.*Solar.*Lockdown|Zero-Emission/.test(s.textContent),
      hasMetrics: /Grid Load.*Q\. Latency/.test(s.textContent),
      hasLog: /DIGITAL TWIN/.test(s.textContent),
    }
  })
}
console.log(JSON.stringify(info ?? 'section never appeared', null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 5).join('\n') : 'none')
await browser.close()
