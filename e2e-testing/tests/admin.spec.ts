import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './authHelper';
import { createInidivEvacPin } from './seedHelper'; 
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

test('Admin Barangay Dashboard and Management', async ({ page }) => {
  test.setTimeout(180_000); 

  await loginAsAdmin(page);

  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await test.step('View Barangay Dashboard', async () => {
    await page.getByRole('link', { name: 'Barangay Management' }).click();
    await expect(page.getByText('Barangay Greenhills')).toBeVisible({timeout: 90_000});

    const activeCard = page.locator('div.rounded-lg').filter({ hasText: 'Active Barangay Users' });
    await expect(activeCard.getByText('1')).toBeVisible({timeout: 60_000});
  })

  await test.step('View Barangay User', async () => {
    const brgyCard = page.locator('div.border').filter({ hasText: 'Barangay Greenhills' });
    brgyCard.getByRole('button', { name: 'Details' }).click();
    await expect(page.locator('#Admin_GovopUsernameField')).toHaveValue('Greenhills', {timeout: 60_000});
  })

  await test.step('Edit Barangay User', async () => {
    await page.getByRole('button', { name: 'Update' }).click(); 
    await page.locator('#Admin_GovopUsernameField').fill('Greenhills Edit', {timeout: 60_000});
    await page.locator('#Admin_GovopCityField').click();
    await page.getByText('San Juan City').click({timeout: 60_000});
    await page.locator('#Admin_GovopBrgyField').click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Barangay user updated!')).toBeVisible({timeout: 60_000});
    await expect(page.getByRole('button', { name: 'Update' })).toBeVisible({timeout: 60_000});
  })
  
  await test.step('Verify Successful Barangay Edit', async () => {
    await expect(page.locator('#Admin_GovopUsernameField')).toHaveValue('Greenhills Edit', {timeout: 60_000});
  })

  await test.step('Restore Barangay Details', async () => {
    await page.getByRole('button', { name: 'Update' }).click(); 
    await page.locator('#Admin_GovopUsernameField').fill('Greenhills', {timeout: 60_000});
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Barangay user updated!')).toBeVisible({timeout: 60_000});
    await expect(page.getByRole('button', { name: 'Update' })).toBeVisible({timeout: 60_000});
  })
})


test('Admin Pin Dashboard and Management', async ({ page }) => {
  test.setTimeout(360_000); 

  await createInidivEvacPin(page);
  await loginAsAdmin(page);

  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await test.step('View Pin Dashboard', async () => {
    await page.getByRole('link', { name: 'Pins Evacuation and Hazard' }).click();
    await expect(page.getByText('Seeded Evacuation Center')).toBeVisible({timeout: 90_000});

    const activeCard = page.locator('div.rounded-lg').filter({ hasText: 'Active Evacuation Pins' });
    await expect(activeCard.getByText('1')).toBeVisible({timeout: 60_000});
  })

  await test.step('View Pin Details', async () => {
    const pinCard = page.locator('div.border').filter({ hasText: 'Seeded Evacuation Center' });
    pinCard.getByRole('button', { name: 'Details' }).click();
    await expect(page.locator('#Admin_EvacDetailsName')).toHaveValue('Seeded Evacuation Center', {timeout: 60_000});
    await expect(page.locator('#Admin_EvacDetailsPostedName')).toHaveValue('pw-seeder');
  })

  await test.step('Mark Pin as Full', async () => {
    await page.getByRole('button', { name: 'Mark as Full' }).click();
    await expect(page.getByText('Pin marked as full!')).toBeVisible({timeout: 60_000});
    await expect(page.getByRole('button', { name: 'Mark as Open' })).toBeVisible({timeout: 30_000});
  })

  await test.step('Delete Pin', async () => {
    await page.locator('#Admin_EvacDetailsDelBtn').click();
    await expect(page.getByText('Pin Deactivated')).toBeVisible({timeout: 60_000});
    const activeCard = page.locator('div.rounded-lg').filter({ hasText: 'Active Evacuation Pins' });
    await expect(activeCard.getByText('0')).toBeVisible({timeout: 60_000});
  })
})

