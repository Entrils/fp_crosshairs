import { expect, test } from '@playwright/test'

test('gallery pagination and complete owner workflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Gallery pages' })).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.locator('button[aria-current="page"]')).toHaveText('2')

  await page.goto('/admin')
  await page.getByLabel('Password').fill('playwright-admin-password')
  await page.getByRole('button', { name: /Sign in/i }).click()
  await expect(page.getByRole('heading', { name: 'Manage crosshairs' })).toBeVisible()

  await page.getByLabel('Name').fill('E2E Crosshair')
  await page.getByLabel('Tags').fill('e2e, dot')
  await page.getByLabel('Color').selectOption('white')
  await page.getByRole('button', { name: 'Type: Not selected' }).click()
  await page.getByRole('option', { name: 'Dot' }).click()
  await page.getByLabel('Crosshair code').fill('e2e-crosshair-code')
  await page.getByLabel('Short description').fill('Created by Playwright')
  await page.locator('input[name="screenshot"]').setInputFiles({
    name: 'crosshair.png',
    mimeType: 'image/png',
    buffer: Buffer.from('e2e-image'),
  })
  await page.getByRole('button', { name: /Publish crosshair/i }).click()
  await expect(page.getByRole('status')).toContainText('Crosshair published')

  await page.getByRole('button', { name: /All crosshairs/i }).click()
  await expect(page.getByText('E2E Crosshair', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit E2E Crosshair' }).click()
  await page.getByLabel('Name').fill('E2E Crosshair Updated')
  await page.getByRole('button', { name: /Save changes/i }).click()
  await expect(page.getByRole('status')).toContainText('Changes saved')
  await expect(page.getByText('E2E Crosshair Updated', { exact: true })).toBeVisible()

  await page.goto('/')
  await page.getByPlaceholder('Search by name or tag...').fill('E2E Crosshair Updated')
  const crosshairLink = page.getByRole('link', { name: 'E2E Crosshair Updated' })
  await expect(crosshairLink).toBeVisible()
  const href = await crosshairLink.getAttribute('href')
  expect(href).toMatch(/^\/crosshairs\//)

  await page.goto(href)
  await expect(page.getByRole('heading', { name: 'E2E Crosshair Updated' })).toBeVisible()
  await page.getByRole('button', { name: 'Copy code' }).click()
  await expect(page.getByRole('status')).toContainText('Crosshair code copied')

  await page.goto('/admin')
  await page.getByRole('button', { name: /All crosshairs/i }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete E2E Crosshair Updated' }).click()
  await expect(page.getByText('E2E Crosshair Updated', { exact: true })).toHaveCount(0)
})
