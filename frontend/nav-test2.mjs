import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise((r) => setTimeout(r, 6000))

// check #work position
const info = await page.evaluate(() => {
  const el = document.getElementById('work')
  return el ? { y: el.getBoundingClientRect().top + window.scrollY, exists: true, scrollHeight: document.documentElement.scrollHeight } : { exists: false }
})
console.log('#work position:', JSON.stringify(info))

// click WORK twice with a pause
for (let i = 0; i < 2; i++) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('nav button')].find((b) => b.textContent.includes('WORK'))
    btn?.click()
  })
  await new Promise((r) => setTimeout(r, 2000))
  console.log(`click #${i + 1} -> scrollY =`, await page.evaluate(() => Math.round(window.scrollY)))
}

// try logo (hero)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('header button')].find((b) => b.textContent.includes('NOVA'))
  btn?.click()
})
await new Promise((r) => setTimeout(r, 2000))
console.log('click logo -> scrollY =', await page.evaluate(() => Math.round(window.scrollY)))

console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
await browser.close()
