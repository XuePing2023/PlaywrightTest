import { writeFile } from 'node:fs/promises'

import { test as base, expect } from '@playwright/test'

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * `step(title, body)` runs `body` as a named `test.step` and captures a
 * full-page screenshot of the result.
 *
 * Each screenshot is written twice: a numbered, readable copy under
 * `test-results/` (uploaded as the `step-screenshots` artifact) and an
 * attachment embedded in the HTML report.
 *
 * The screenshot happens in a `finally`, so failing steps are captured too,
 * and it is best-effort so it can never mask the real failure.
 */
export const test = base.extend<{
  step: (title: string, body: () => Promise<unknown> | void) => Promise<void>
}>({
  step: async ({ page }, use, testInfo) => {
    /* Per-test, so numbering restarts for each test. */
    let index = 0

    await use(async (title, body) => {
      const sequence = String(++index).padStart(2, '0')

      await test.step(title, async () => {
        try {
          await body()
        } finally {
          try {
            const shot = await page.screenshot({ fullPage: true, animations: 'disabled' })
            const file = testInfo.outputPath(`${sequence}-${slug(title)}.png`)
            await writeFile(file, shot)
            await testInfo.attach(`${sequence} ${title}`, { path: file, contentType: 'image/png' })
          } catch {
            /* Screenshotting is best-effort; never mask the real failure. */
          }
        }
      })
    })
  },
})

export { expect }
