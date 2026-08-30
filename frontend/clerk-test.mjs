import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 6000))
const info = await page.evaluate(() => {
  const body = document.body.innerText
  return {
    hasSignIn: body.includes('SIGN IN') || body.includes('Sign In'),
    hasClerkIframe: !!document.querySelector('iframe[data-clerk]'),
    hero: !!document.getElementById('hero'),
    height: document.documentElement.scrollHeight,
  }
})
console.log(JSON.stringify(info, null, 2))
console.log('ERRORS:', errors.length ? errors.slice(0, 6).join('\n') : 'none')
await browser.close()
