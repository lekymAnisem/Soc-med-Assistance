import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
const urls = []
page.on('request', (req) => {
  const u = req.url()
  if (u.includes('splinecode') || u.includes('my.spline') || u.includes('prod.spline')) urls.push(u)
})
await page.goto('https://community.spline.design/file/9c3f266f-c954-4b21-a76c-6e0922266623', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 8000))
console.log('CAPTURED URLS:')
for (const u of urls.slice(0, 10)) console.log(' ', u)
console.log('total spline requests:', urls.length)
await browser.close()
