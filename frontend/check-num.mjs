import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
const nums = []
for (let i = 0; i < 10; i++) {
  await new Promise((r) => setTimeout(r, 500))
  const n = await page.evaluate(() => {
    const el = document.querySelector('.fixed.inset-0.z-\\[10000\\] span')
    return el ? el.textContent : 'GONE'
  })
  nums.push(n)
}
console.log('num over time:', nums.join(', '))
const hero = await page.evaluate(() => ({ hero: !!document.getElementById('hero'), height: document.documentElement.scrollHeight }))
console.log('final:', JSON.stringify(hero))
await browser.close()
