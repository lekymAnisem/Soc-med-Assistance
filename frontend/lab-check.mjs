import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
let info = null
for (let i = 0; i < 30 && !info; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  info = await page.evaluate(() => {
    const lab = document.getElementById('lab')
    if (!lab) return null
    return {
      hasCanvas: !!lab.querySelector('canvas'),
      canvasW: lab.querySelector('canvas')?.width ?? 0,
      hasSliders: lab.querySelectorAll('input[type=range]').length,
      hasPresets: /Minimalist|Dark Cyber|Neon|Organic/.test(lab.textContent),
      hasExport: /Download Snapshot|LinkedIn Banner/.test(lab.textContent),
      hasPlay: /Play|Pause/.test(lab.textContent),
    }
  })
}
console.log(JSON.stringify(info ?? 'lab never appeared', null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 5).join('\n') : 'none')
await browser.close()
