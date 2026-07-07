import { Page, expect } from '@playwright/test';
import { loginAsSeeder, loginAsBarangay, loginAsIndiv } from './authHelper';
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

export async function createHotline(page: Page): Promise<void> {
    await loginAsBarangay(page);
  
    const uniqueName = `Admin Test Hotline ${chance.integer({ min: 100, max: 999 })}`;
    const randomMobile = `09${chance.string({ length: 9, pool: '0123456789' })}`;
    
    page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

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
    
    await page.locator('#Navbar_Back').click();
    await page.getByRole('link', { name: 'Settings' }).click({timeout: 30_000});
    await page.getByRole('button', { name: 'Logout' }).click({timeout: 30_000});
    await expect(page.getByText('You\'re logged out!')).toBeVisible({timeout: 60_000});
}


export async function createIndivFeedback(page: Page): Promise<void> {
    await loginAsIndiv(page);

    const uniqueFeedback = `Indiv Feedback Test ${chance.integer({ min: 100, max: 999 })}`;

    page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Give Feedback' }).click({timeout: 30_000});
    await page.locator('label').filter({ hasText: /^5 Stars$/ }).click();
    await page.getByRole('textbox', { name: 'Feel free to say what you' }).fill(uniqueFeedback);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Feedback sent. Thank you for')).toBeVisible({timeout: 30_000});

    await page.locator('#Navbar_Back').click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByText('You\'re logged out!')).toBeVisible({timeout: 60_000});
}


export async function createBrgyFeedback(page: Page): Promise<void> {
    await loginAsBarangay(page);

    const uniqueFeedback = `Brgy Feedback Test ${chance.integer({ min: 100, max: 999 })}`;

    page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Give Feedback' }).click({timeout: 30_000});
    await page.locator('label').filter({ hasText: /^5 Stars$/ }).click();
    await page.getByRole('textbox', { name: 'Feel free to say what you' }).fill(uniqueFeedback);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Feedback sent. Thank you for')).toBeVisible({timeout: 30_000});

    await page.locator('#Navbar_Back').click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByText('You\'re logged out!')).toBeVisible({timeout: 60_000});
}