import { test, expect } from '@playwright/test';
import { loginAsBarangay } from './authHelper'; 
import { Chance } from 'chance';

const chance = new Chance();

test('Brgy Sensor Management', async ({ page }) => {
  test.setTimeout(180_000); 

  await loginAsBarangay(page);

  const uniqueName = `Test Sensor ${chance.integer({ min: 100, max: 999 })}`;

  await test.step('Add a New Sensor', async () => {
    await page.getByRole('link', { name: 'History' }).click();
    await page.getByRole('tab', { name: 'Sensors' }).click();
    await page.getByRole('button', { name: 'Add Sensor' }).click();
    await page.locator('#Sensor_NameField').fill(uniqueName, {timeout: 30_000});
    await page.locator('#Sensor_MountHeightField').fill('3');
    await page.locator('#Sensor_LatitudeField').fill('14.597447314583043');
    await page.locator('#Sensor_LongitudeField').fill('121.03924222948187');
    await page.locator('#Sensor_CityField').click();
    await page.getByText('San Juan City').click({timeout: 30_000});
    await page.locator('#Sensor_BrgyField').click();
    await page.getByText('Barangay Greenhills').click({timeout: 30_000});
    await page.locator('#Sensor_AddressField').fill('Wilson Street Bridge');
    await page.locator('#Sensor_YellowField').fill('1');
    await page.locator('#Sensor_OrangeField').fill('2');
    await page.locator('#Sensor_RedField').fill('2.5');
    await page.getByRole('button', { name: 'Add Sensor' }).click();
  })

 await test.step('Verify Sensor Details', async () => {
  await page.getByRole('tab', { name: 'Sensors' }).click();
  await expect(page.getByText(uniqueName)).toBeVisible({timeout: 60_000});
  await page.getByRole('button', { name: 'Details' }).first().click();
  await expect(page.locator('#Sensor_NameField')).toHaveValue(uniqueName, {timeout: 30_000});
  await expect(page.locator('#Sensor_MountHeightField')).toHaveValue('3');
  await expect(page.locator('#Sensor_LatitudeField')).toHaveValue('14.597447314583043');
  await expect(page.locator('#Sensor_LongitudeField')).toHaveValue('121.03924222948187');
  await expect(page.locator('#Sensor_CityField')).toHaveValue('San Juan City', {timeout: 30_000});
  await expect(page.locator('#Sensor_BrgyField')).toHaveValue('Barangay Greenhills', {timeout: 30_000});
  await expect(page.locator('#Sensor_AddressField')).toHaveValue('Wilson Street Bridge');
  await expect(page.locator('#Sensor_YellowField')).toHaveValue('1');
  await expect(page.locator('#Sensor_OrangeField')).toHaveValue('2');
  await expect(page.locator('#Sensor_RedField')).toHaveValue('2.5');
  await expect(page.locator('#Sensor_RegisteredBy')).toHaveValue('Barangay Greenhills');
 })




//   await page.getByRole('button', { name: 'Update' }).click();
//   await page.locator('#Sensor_OrangeField').fill('1.5');
//   await page.locator('#Sensor_NameField').fill('Edited Sensor');
//   await page.getByRole('button', { name: 'Submit' }).click();
//   await expect(page.getByText('Sensor is successfully')).toBeVisible();
//   await expect(page.locator('#Sensor_NameField')).toBeVisible();

//   await page.getByRole('button', { name: 'Delete' }).click();
})
