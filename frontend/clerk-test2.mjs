import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
let result = null
for (let i = 0; i < 20 && !result; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  result = await page.evaluate(() => {
    const body = document.body.innerText
    if (document.getElementById('hero')) {
      return {
        hasSignIn: /sign in/i.test(body),
        hero: true,
        height: document.documentElement.scrollHeight,
      }
    }
    return null
  })
}
console.log(JSON.stringify(result ?? { hero: false, timeout: true }, null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 4).join('\n') : 'none')
await browser.close()
