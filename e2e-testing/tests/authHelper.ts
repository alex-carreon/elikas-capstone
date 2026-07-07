import { Page, expect } from '@playwright/test';

export async function loginAsBarangay(page: Page): Promise<void> {
  const testEmail = process.env.BARANGAY_EMAIL;  
  const password = process.env.BARANGAY_PASSWORD;  

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign-in' })).toBeVisible();
  await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});

  await page.getByRole('button', { name: 'Sign-in' }).click();
  await expect(page.locator('#LogIn_PasswordField')).toBeVisible();
  await page.locator('#LogIn_EmailField').fill(testEmail as string);
  await page.locator('#LogIn_PasswordField').fill(password as string);
  await page.getByRole('button', { name: 'Log In' }).click();
  
  // Ensure app loads when logged in
  await expect(page.getByText('You\'re Logged In!')).toBeVisible({timeout: 60_000});
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
}

export async function loginAsIndiv(page: Page): Promise<void> {
  const testEmail = process.env.INDIV_EMAIL;   
  const password = process.env.INDIV_PASSWORD;  

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign-in' })).toBeVisible();
  await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});

  await page.getByRole('button', { name: 'Sign-in' }).click();
  await expect(page.locator('#LogIn_PasswordField')).toBeVisible();
  await page.locator('#LogIn_EmailField').fill(testEmail as string);
  await page.locator('#LogIn_PasswordField').fill(password as string);
  await page.getByRole('button', { name: 'Log In' }).click();
  
  // Ensure app loads when logged in
  await expect(page.getByText('You\'re Logged In!')).toBeVisible({timeout: 60_000});
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
}