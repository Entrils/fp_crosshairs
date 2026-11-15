import { expect, test } from '@playwright/test'

test('privacy policy is public and advertising stays completely disabled by default', async ({ page }) => {
  const requestedUrls = []
  page.on('request', (request) => requestedUrls.push(request.url()))

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Google advertising' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Google Ads Settings.' })).toHaveAttribute(
    'href',
    'https://adssettings.google.com/',
  )
  await expect(page.locator('.ad-placement')).toHaveCount(0)
  expect(requestedUrls.some((url) => url.includes('googlesyndication.com'))).toBe(false)
})
