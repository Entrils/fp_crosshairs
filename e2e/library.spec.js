import { expect, test } from '@playwright/test'

test('favorites, recent history and related crosshairs work locally', async ({ page }) => {
  await page.goto('/')

  const favoriteButton = page.getByRole('button', { name: 'Add to favorites' }).first()
  await favoriteButton.click()
  await expect(page.getByRole('button', { name: 'Remove from favorites' }).first()).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible()

  await page.locator('.card__open').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('heading', { name: 'Recently viewed' })).toBeVisible()

  await page.goto('/crosshairs/fixture-1')
  await expect(page.getByRole('heading', { name: 'Related crosshairs' })).toBeVisible()
  await expect(page.locator('.related-grid a')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible()
})
