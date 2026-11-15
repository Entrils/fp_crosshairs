import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

test('mobile gallery stays within viewport and never loads Three.js', async ({ page }) => {
  const requestedUrls = []
  page.on('request', (request) => requestedUrls.push(request.url()))

  await page.goto('/')
  await expect(page.locator('.cards-grid .card').first()).toBeVisible()
  await page.waitForTimeout(1700)

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(requestedUrls.some((url) => url.includes('HeroScene'))).toBe(false)
  expect(requestedUrls.some((url) => url.includes('googlesyndication.com'))).toBe(false)
  await expect(page.locator('.hero-three, .hero canvas')).toHaveCount(0)
  await expect(page.locator('.ad-placement')).toHaveCount(0)

  await page.locator('.card__open').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const dialogWidth = await dialog.evaluate((element) => element.getBoundingClientRect().width)
  expect(dialogWidth).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Type: All types' }).click()
  const crossOption = page.getByRole('option', { name: 'Crosshair' })
  await expect(crossOption.locator('.type-icon')).toBeVisible()
  await crossOption.click()
  await expect(page.getByRole('button', { name: 'Type: Crosshair' })).toBeVisible()
})
