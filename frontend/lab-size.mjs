import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
let info = null
for (let i = 0; i < 30 && !info; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  info = await page.evaluate(() => {
    const lab = document.getElementById('lab')
    const c = lab?.querySelector('canvas')
    if (!lab || !c) return null
    return {
      canvasAttr: [c.width, c.height],
      canvasCss: [c.clientWidth, c.clientHeight],
      wrapRect: lab.querySelector('div.relative')?.getBoundingClientRect().width,
      sectionW: lab.getBoundingClientRect().width,
    }
  })
}
console.log(JSON.stringify(info, null, 2))
await browser.close()
