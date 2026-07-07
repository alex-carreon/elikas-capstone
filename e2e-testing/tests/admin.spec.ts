import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './authHelper';
import { Chance } from 'chance';

const chance = new Chance();

test('Admin User Dashboard and Management', async ({ page }) => {
  test.setTimeout(180_000); 

  await loginAsAdmin(page);

  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await test.step('View User Dashboard', async () => {
    await page.getByRole('link', { name: 'User Information Individual' }).click();
    await expect(page.getByText('Indiv Users')).toBeVisible({timeout: 30_000});
    const activeCard = page.locator('div.rounded-lg').filter({ hasText: 'Active Users' });
    await expect(activeCard.getByText('2')).toBeVisible({timeout: 60_000});
    await expect(page.getByText('Deactivated Users')).toBeVisible();
    await expect(page.getByText('Feedback Average')).toBeVisible();
  })

  await test.step('View User Record', async () => {
    await expect(page.getByText('Playwright')).toBeVisible({timeout: 60_000});
    const userCard = page.locator('div.border').filter({ hasText: 'Playwright' });
    await userCard.getByRole('button', { name: 'Details' }).click();
    await expect(page.locator('#Admin_IndivUsernameField')).toHaveValue('indiv-pw-tester', {timeout: 60_000});
    await expect(page.locator('#Admin_IndivFirstnameField')).toHaveValue('Playwright');
  })

  await test.step('Edit User Record', async () => {
    await page.getByRole('button', { name: 'Update' }).click();
    await page.locator('#Admin_IndivFirstnameField').fill('Playwright Admin User Edit', {timeout: 60_000});
    await page.locator('#Admin_IndivCityField').click();
    await page.getByText('Outside San Juan').click({timeout: 60_000});
    await page.locator('#Admin_IndivBrgyField').click();
    await page.getByText('Unregistered Barangay').click({timeout: 60_000});
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('button', { name: 'Update' })).toBeVisible({timeout: 60_000});
  })

  await test.step('Verify Successful User Edit', async () => {
    await page.locator('#Admin_BackBtn').click();
    await expect(page.getByText('Playwright Admin User Edit')).toBeVisible({timeout: 60_000});
  })

  await test.step('Restore User Details', async () => {
    const userCard = page.locator('div.border').filter({ hasText: 'Playwright Admin User Edit' });
    await userCard.getByRole('button', { name: 'Details' }).click();
    await page.getByRole('button', { name: 'Update' }).click({timeout: 60_000});
    await page.locator('#Admin_IndivFirstnameField').fill('Playwright', {timeout: 60_000});
    await page.locator('#Admin_IndivCityField').click();
    await page.getByText('Outside San Juan').click({timeout: 60_000});
    await page.locator('#Admin_IndivBrgyField').click();
    await page.getByText('Unregistered Barangay').click({timeout: 60_000});
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('button', { name: 'Update' })).toBeVisible({timeout: 60_000});
  })
  
  await test.step('Verify Successful Restore Edit', async () => {
    await page.locator('#Admin_BackBtn').click();
    await expect(page.getByText('Playwright Indiv Tester')).toBeVisible({timeout: 60_000});
  })
});