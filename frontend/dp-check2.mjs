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
  info = await page.evaluate(() => !!document.getElementById('products'))
}
await new Promise((r) => setTimeout(r, 1000))
// click Engineering
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#products button')]
  btns.find((b) => b.textContent.trim().startsWith('Engineering'))?.click()
})
for (const t of [600, 1500, 3000]) {
  await new Promise((r) => setTimeout(r, t === 600 ? 600 : t === 1500 ? 900 : 1500))
  const s = await page.evaluate(() => {
    const articles = [...document.querySelectorAll('#products article')]
    return {
      count: articles.length,
      titles: articles.map((a) => a.querySelector('h3')?.textContent ?? ''),
    }
  })
  console.log('after ' + (t) + 'ms:', JSON.stringify(s))
}
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
