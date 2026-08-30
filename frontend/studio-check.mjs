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
    return {
      hasCanvas: !!s.querySelector('canvas'),
      hasGeom: /Sphere.*Box.*Torus Knot/.test(s.textContent),
      hasMaterial: /Metalness.*Roughness.*Wireframe/.test(s.textContent),
      hasEnv: /Environment/.test(s.textContent),
      hasGen: /Describe a 3D object/.test(s.textContent),
      hasExport: /Download Snapshot/.test(s.textContent),
    }
  })
}
console.log(JSON.stringify(info ?? 'section never appeared', null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
