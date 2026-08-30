import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 180)) })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
for (let i = 0; i < 6; i++) {
  await new Promise((r) => setTimeout(r, 5000))
  const s = await page.evaluate(() => {
    const loader = document.querySelector('.fixed.inset-0.z-\\[10000\\]')
    return {
      loaderVisible: !!loader,
      loaderTransform: loader ? getComputedStyle(loader).transform.slice(0, 30) : null,
      hero: !!document.getElementById('hero'),
      height: document.documentElement.scrollHeight,
      bodyStart: document.body.innerText.slice(0, 40).replace(/\n/g, ' | '),
    }
  })
  console.log('t=' + ((i + 1) * 5) + 's', JSON.stringify(s))
}
console.log('ERRORS:', errors.length ? errors.slice(0, 6).join('\n') : 'none')
await browser.close()
