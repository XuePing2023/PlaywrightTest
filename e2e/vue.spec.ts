import { expect, test } from '@playwright/test'

test.describe('app shell', () => {
  test('renders the home page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Vite App')
    await expect(page.getByAltText('Vue logo')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible()
  })

  test('renders both navigation links', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible()
  })

  test('links to the Vite docs in a new tab', async ({ page }) => {
    await page.goto('/')

    const viteLink = page.getByRole('link', { name: 'Vite', exact: true })
    await expect(viteLink).toHaveAttribute('href', 'https://vite.dev/')
    await expect(viteLink).toHaveAttribute('target', '_blank')
    await expect(viteLink).toHaveAttribute('rel', 'noopener')
  })
})

test.describe('routing', () => {
  test('navigates between the home and about routes', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'About', exact: true }).click()

    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'This is an about page' })).toBeVisible()
    /* vue-router marks the active route on the link itself. */
    await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveClass(
      /router-link-exact-active/,
    )

    await page.getByRole('link', { name: 'Home', exact: true }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible()
  })

  test('deep-links straight to a route', async ({ page }) => {
    /* Exercises the SPA history fallback served by `vite preview`. */
    await page.goto('/about')

    await expect(page.getByRole('heading', { name: 'This is an about page' })).toBeVisible()
  })
})
