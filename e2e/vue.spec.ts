import { expect, test } from './fixtures'

test.describe('app shell', () => {
  test('renders the home page', async ({ page, step }) => {
    await step('open the home page', () => page.goto('/'))
    await step('title the page', () => expect(page).toHaveTitle('Vite App'))
    await step('show the Vue logo', () => expect(page.getByAltText('Vue logo')).toBeVisible())
    await step('show the welcome heading', () =>
      expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible(),
    )
  })

  test('renders both navigation links', async ({ page, step }) => {
    await step('open the home page', () => page.goto('/'))
    await step('show the Home link', () =>
      expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible(),
    )
    await step('show the About link', () =>
      expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible(),
    )
  })

  test('links to the Vite docs in a new tab', async ({ page, step }) => {
    await step('open the home page', () => page.goto('/'))

    /* `TheWelcome.vue` renders a second "Vite" link inside <main>, so scope to the header. */
    const viteLink = page.locator('header').getByRole('link', { name: 'Vite', exact: true })
    await step('point the header Vite link at the Vite docs in a new tab', async () => {
      await expect(viteLink).toHaveAttribute('href', 'https://vite.dev/')
      await expect(viteLink).toHaveAttribute('target', '_blank')
      await expect(viteLink).toHaveAttribute('rel', 'noopener')
    })
  })
})

test.describe('routing', () => {
  test('navigates between the home and about routes', async ({ page, step }) => {
    await step('open the home page', () => page.goto('/'))

    await step('click the About link', async () => {
      await page.getByRole('link', { name: 'About', exact: true }).click()
      await expect(page).toHaveURL('/about')
      await expect(page.getByRole('heading', { name: 'This is an about page' })).toBeVisible()
    })

    await step('mark the About link as active', () =>
      /* vue-router marks the active route on the link itself. */
      expect(page.getByRole('link', { name: 'About', exact: true })).toHaveClass(
        /router-link-exact-active/,
      ),
    )

    await step('click the Home link', async () => {
      await page.getByRole('link', { name: 'Home', exact: true }).click()
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible()
    })
  })

  test('deep-links straight to a route', async ({ page, step }) => {
    /* Exercises the SPA history fallback served by `vite preview`. */
    await step('open /about directly', () => page.goto('/about'))
    await step('show the about heading', () =>
      expect(page.getByRole('heading', { name: 'This is an about page' })).toBeVisible(),
    )
  })
})
