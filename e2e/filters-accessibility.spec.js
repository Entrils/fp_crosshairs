import { expect, test } from '@playwright/test'

test('gallery filters are keyboard accessible and survive reloads', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Control+K')
  await expect(page.getByPlaceholder('Search by name or tag...')).toBeFocused()

  const typeButton = page.getByRole('button', { name: 'Type: All types' })
  await typeButton.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('option', { name: 'All types' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Type: Circle' })).toBeVisible()
  await expect(page).toHaveURL(/type=circle/)

  const colorButton = page.getByRole('button', { name: 'Color: All colors' })
  await colorButton.click()
  const colorSlider = page.getByRole('slider', { name: 'Color' })
  await colorSlider.focus()
  await page.keyboard.press('Enter')
  await expect(colorButton).toHaveAccessibleName('Color: All colors')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Color: Orange' })).toBeVisible()
  await expect(page).toHaveURL(/color=orange/)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Type: Circle' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Color: Orange' })).toBeVisible()

  await page.goto('/')
  const quickCopy = page.locator('.quick-copy').first()
  await quickCopy.focus()
  await expect(quickCopy).toHaveCSS('opacity', '1')
})
