import { test, expect } from '@playwright/test';
import { loginAsBarangay, loginAsIndiv } from './authHelper'; 
import { Chance } from 'chance';

const chance = new Chance();

test('Brgy Hotline Management', async ({ page }) => {
  test.setTimeout(180_000); 

  await loginAsBarangay(page);

  const uniqueName = `Test Hotline ${chance.integer({ min: 100, max: 999 })}`;
  const randomMobile = `09${chance.string({ length: 9, pool: '0123456789' })}`;
  const randomPhone = `(000)${chance.string({ length: 7, pool: '0123456789' })}`;
    
  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await test.step('Add a New Hotline', async () => { 
    await page.getByRole('link', { name: 'Hotlines' }).click();
    await page.locator('#Hotlines-Add').click();
    await page.locator('#Hotline_NameField').fill(uniqueName);
    await page.locator('#Hotline_AddressField').fill('Test Street');
    await expect(page.getByText('San Juan City').first()).toBeVisible({timeout: 30_000});
    await page.locator('#Hotline_BrgyField').click();
    await page.getByText('Barangay Addition Hills').click({timeout: 30_000});
    await page.locator('#Hotline_OfficialNumberField').fill(randomMobile);
    await page.getByRole('checkbox').click();
    await page.locator('#Hotline_SubmitBtn').click();
    await expect(page.getByText('Contact successfully added!')).toBeVisible({timeout: 30_000});
  })
  
  await test.step('Verify Hotline Details', async () => { 
    await expect(page.getByText(uniqueName)).toBeVisible();
    await expect(page.getByText(randomMobile)).toBeVisible();
  })

  await test.step('Edit Hotline Details', async () => { 
    const hotlineCard = page.locator('div.border-solid').filter({ hasText: uniqueName });
    await hotlineCard.locator('a[href*="/HotlinesForm/"]').click({timeout: 60_000});
    await page.locator('#Hotline_UpdateBtn').click({timeout: 30_000});
    await page.locator('#Hotline_SecondNumberField').fill(randomPhone);
    await page.locator('#Hotline_SubmitUpdBtn').click();
    await expect(page.getByText('Contact updated added!')).toBeVisible({timeout: 30_000});
  })

  await test.step('Verify Hotline Edit', async () => { 
    await expect(page.getByText(randomPhone)).toBeVisible({timeout: 30_000});
  })

  await test.step('Test Filters', async () => { 
    await page.locator('#Hotlines_BrgyFilter').click();
    await page.getByText('Barangay Onse').first().click({timeout: 30_000});
    await expect(page.getByText(uniqueName)).not.toBeVisible({timeout: 30_000});
    await page.locator('#Hotlines_BrgyFilter').click();
    await page.getByText('Barangay Addition Hills').first().click({timeout: 30_000});
    await expect(page.getByText(uniqueName)).toBeVisible({timeout: 30_000});
  })

  await test.step('Delete Hotline', async () => { 
    const hotlineCard = page.locator('div.border-solid').filter({ hasText: uniqueName });
    await hotlineCard.locator('a[href*="/HotlinesForm/"]').click({timeout: 60_000});
    await page.locator('#Hotline_DeleteBtn').click({timeout: 30_000});
    await page.locator('#EvacPin_DeacBtn').click();
    await expect(page.getByText('Hotline deleted!')).toBeVisible({timeout: 30_000});
  })
});

test('Indiv Hotline View', async ({ page }) => {
  test.setTimeout(180_000); 

  await loginAsIndiv(page);
    
  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await page.getByRole('link', { name: 'Hotlines' }).click({timeout: 60_000});
  await expect(page.getByText('Seeded Hotline')).toBeVisible({timeout: 60_000});
})