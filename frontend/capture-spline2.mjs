import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const urls = new Set()
page.on('response', async (res) => {
  const u = res.url()
  if (u.includes('spline') && (res.headers()['content-type'] || '').includes('json')) {
    urls.add(u)
  }
  if (u.includes('splinecode') || u.includes('scene')) urls.add(u)
})
await page.goto('https://community.spline.design/file/9c3f266f-c954-4b21-a76c-6e0922266623', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 10000))
console.log('JSON/spline URLs:')
for (const u of urls) console.log(' ', u.slice(0, 160))
await browser.close()
