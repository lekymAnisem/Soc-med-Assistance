import puppeteer from 'puppeteer-core'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 6000))
const info = await page.evaluate(() => {
  const hero = document.getElementById('hero')
  return {
    heroExists: !!hero,
    videoBg: !!hero?.querySelector('video'),
    videoSrc: hero?.querySelector('video')?.currentSrc?.slice(0, 110) || hero?.querySelector('video')?.src?.slice(0, 110) || null,
    splineContainer: !!hero?.querySelector('[class*="opacity"]') || !!hero?.textContent.includes('Scroll'),
    scrollHint: hero?.textContent.includes('Scroll') ?? false,
    pageHeight: document.documentElement.scrollHeight,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
