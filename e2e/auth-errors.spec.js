import { expect, test } from '@playwright/test'

test('admin login rejects an incorrect password', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel('Password').fill('definitely-wrong-password')
  await page.getByRole('button', { name: /Sign in/i }).click()

  await expect(page.getByText('Incorrect password')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Manage crosshairs' })).toHaveCount(0)
})

test('protected API and invalid filters fail closed', async ({ request }) => {
  const unauthorized = await request.post('/api/crosshairs', {
    headers: { 'X-Admin-Request': '1' },
  })
  expect(unauthorized.status()).toBe(401)
  expect((await unauthorized.json()).code).toBe('unauthorized')

  const invalidFilter = await request.get('/api/crosshairs?type=laser')
  expect(invalidFilter.status()).toBe(400)
  expect((await invalidFilter.json()).code).toBe('invalidForm')
})

test('missing crosshair page renders a useful 404 state', async ({ page }) => {
  const response = await page.goto('/crosshairs/does-not-exist')
  expect(response.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Nothing found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to gallery' })).toBeVisible()
})
