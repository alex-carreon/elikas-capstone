import { Page, expect } from '@playwright/test';
import { loginAsSeeder } from './authHelper';
import { Chance } from 'chance';

const chance = new Chance();

export async function createInidivEvacPin(page: Page): Promise<void> {
    await loginAsSeeder(page);
  
    const name = `Seeded Evacuation Center`;
    const randomMobile = `09${chance.string({ length: 9, pool: '0123456789' })}`;
      
    page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));
  
    await page.locator('#Map_Container').click();
    await page.getByRole('button', { name: 'Mark as Evacuation Site' }).click();
    await page.getByRole('checkbox').nth(0).click();
    await page.getByRole('checkbox').nth(1).click();
    await page.locator('#EvacPin_LocTypeField').click();
    await page.getByText('Barangay Hall').click({timeout: 30_000});
    await page.locator('#EvacPin_PinNameField').fill(name);
    await page.locator('#EvacPin_BarangayDropdown').click();
    await page.getByText('Barangay Salapan').click({timeout: 30_000});
    await page.locator('#EvacPin_CapacityField').click();
    await page.getByText('Medium').click({timeout: 30_000});
    await page.getByRole('checkbox').nth(4).click();
    await page.getByRole('checkbox').nth(7).click();
    await page.locator('#EvacPin_KitchenField').fill('2');
    await page.locator('#EvacPin_ContactPersonField').fill('Seeded Indiv Evac Center Pin');
    await page.locator('#EvacPin_ContactNumberField').fill(randomMobile);
    await page.getByRole('checkbox').nth(11).click();
    await page.getByRole('checkbox').nth(12).click();
    await page.locator('#EvacPin_SubmitBtn').click();
    await expect(page.getByText('Pin successfully added!')).toBeVisible({timeout: 30_000});

    await page.getByRole('link', { name: 'Settings' }).click({timeout: 30_000});
    await page.getByRole('button', { name: 'Logout' }).click({timeout: 30_000});
    await expect(page.getByText('You\'re logged out!')).toBeVisible({timeout: 60_000});
}
