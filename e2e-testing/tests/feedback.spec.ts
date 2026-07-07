import { test, expect } from '@playwright/test';
import { createIndivFeedback, createBrgyFeedback } from './seedHelper';
import { loginAsAdmin } from './authHelper';

test('Indiv Feedback', async ({ page }) => {
  test.setTimeout(180_000); 

  await createIndivFeedback(page);
  await loginAsAdmin(page);

  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await page.getByRole('link', { name: 'User Information' }).click();
  await page.getByRole('tab', { name: 'Feedback' }).click();
  const feedbackCard = page.locator('div.border').filter({ hasText: 'Rating' });
  await expect(feedbackCard.getByText('Indiv Feedback Test')).toBeVisible({timeout: 30_000});
})

test('Brgy Feedback', async ({ page }) => {
  test.setTimeout(180_000); 

  await createBrgyFeedback(page);
  await loginAsAdmin(page);

  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await page.getByRole('link', { name: 'User Information' }).click();
  await page.getByRole('tab', { name: 'Feedback' }).click();
  const feedbackCard = page.locator('div.border').filter({ hasText: 'Rating' });
  await expect(feedbackCard.getByText('Brgy Feedback Test')).toBeVisible({timeout: 30_000});
})