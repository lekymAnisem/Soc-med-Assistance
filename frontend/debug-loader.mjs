import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`))
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message.slice(0, 200)}`))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
for (const t of [2000, 5000, 8000]) {
  await new Promise((r) => setTimeout(r, t === 2000 ? 2000 : 3000))
  const s = await page.evaluate(() => {
    const loader = document.querySelector('.fixed.inset-0.z-\\[10000\\]')
    return {
      loaderVisible: !!loader,
      loaderTransform: loader ? getComputedStyle(loader).transform.slice(0, 40) : null,
      bodyStart: document.body.innerText.slice(0, 50).replace(/\n/g, ' | '),
      hero: !!document.getElementById('hero'),
      height: document.documentElement.scrollHeight,
    }
  })
  console.log(`t=${t}ms:`, JSON.stringify(s))
}
console.log('LOGS:')
for (const l of logs.slice(0, 15)) console.log(' ', l)
await browser.close()
