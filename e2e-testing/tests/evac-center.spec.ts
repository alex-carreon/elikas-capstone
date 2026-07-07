import { test, expect } from '@playwright/test';
import { loginAsBarangay } from './authHelper'; 
import { Chance } from 'chance';

const chance = new Chance();

test('Brgy Evac Center Management', async ({ page }) => {
  test.setTimeout(180_000); 

  await loginAsBarangay(page);

  const uniqueName = `Evacuation Center ${chance.integer({ min: 100, max: 999 })}`;
  const randomMobile = `09${chance.string({ length: 9, pool: '0123456789' })}`;
    
  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await test.step('Register evacuation center', async () => {
    await page.locator('#Map_Container').click();
    await page.getByRole('button', { name: 'Mark as Evacuation Site' }).click();
    await page.getByRole('checkbox').nth(0).click();
    await page.getByRole('checkbox').nth(1).click();
    await page.locator('#EvacPin_LocTypeField').click();
    await page.getByText('Barangay Hall').click({timeout: 15_000});
    await page.locator('#EvacPin_PinNameField').fill(uniqueName);
    await page.locator('#EvacPin_BarangayDropdown').click();
    await page.getByText('Barangay Salapan').click({timeout: 15_000});
    await page.locator('#EvacPin_CapacityField').click();
    await page.getByText('Medium').click({timeout: 15_000});
    await page.getByRole('checkbox').nth(4).click();
    await page.getByRole('checkbox').nth(7).click();
    await page.locator('#EvacPin_ToiletField').fill('3');
    await page.locator('#EvacPin_ContactPersonField').fill('CDRRMO');
    await page.locator('#EvacPin_ContactNumberField').fill(randomMobile);
    await page.getByRole('checkbox').nth(12).click();
    await page.getByRole('checkbox').nth(13).click();
    await page.locator('#EvacPin_SubmitBtn').click();
    await expect(page.getByText('Pin successfully added!')).toBeVisible({timeout: 15_000});
  })

  await test.step('Evacuation Pin is Visible on Map', async () => { 
    await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
    await page.locator('#Map_Container').click();
    await expect(page.getByText(uniqueName)).toBeVisible({timeout: 30_000});
    await expect(page.getByText('Persistent')).toBeVisible();
  })

  await test.step('Verify Correct Evacuation Center Details', async () => { 
    await page.locator('#Navbar_History').click();
    await expect(page.getByText(uniqueName)).toBeVisible({timeout: 30_000});
    await page.locator('#History_ActiveEvacDetailsBtn').click();

    await page.locator('#EvacPin_LocType').click();
    await expect(page.locator('#EvacPin_LocType')).toHaveValue('Barangay Hall', {timeout: 30_000});
    await expect(page.locator('#EvacPin_BarangayField')).toHaveValue('Barangay Salapan');
    await expect(page.locator('#EvacPin_Capacity')).toHaveValue('Medium');
  })

  await test.step('Edit Evacuation Center Details', async () => { 
    await page.locator('#EvacPin_UpdatePinBtn').click();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible({timeout: 15_000});
    await page.locator('#EvacPin_DescField').fill('Test edit for evacuation center');
    await page.locator('#EvacPin_ContactPersonField').fill('CDRRMO Edit');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Pin successfully updated!')).toBeVisible({timeout: 30_000});
  })

  await test.step('Verify Successful Edit of Evac Center Details', async () => { 
    await expect(page.locator('#EvacPin_DescField')).toHaveValue('Test edit for evacuation center',{timeout: 30_000});
    await expect(page.locator('#EvacPin_ContactPersonField')).toHaveValue('CDRRMO Edit',{timeout: 30_000});
  })

  await test.step('Mark Evacuation Center as Full', async () => { 
    await page.locator('#EvacPin_FullPinBtn').click({timeout: 15_000});
    await expect(page.getByText('Pin marked as full!')).toBeVisible({timeout: 30_000});
    await expect(page.getByText('Mark as Open')).toBeVisible({timeout: 30_000});
  })

  await test.step('Delete Evacuation Center', async () => { 
    await page.locator('#EvacPin_ClosePinBtn').click();
    await page.locator('#EvacPin_DeacBtn').click();
    await expect(page.getByText('Pin Deactivated!')).toBeVisible({timeout: 30_000});
    await expect(page.getByText('You don\'t have active')).toBeVisible({timeout: 30_000});
  })
})