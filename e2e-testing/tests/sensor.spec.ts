import { test, expect } from '@playwright/test';
import { loginAsBarangay } from './authHelper'; 
import { Chance } from 'chance';

const chance = new Chance();

test('Brgy Sensor Management', async ({ page }) => {
  test.setTimeout(240_000); 

  await loginAsBarangay(page);

  const uniqueName = `Test Sensor ${chance.integer({ min: 100, max: 999 })}`;

  await test.step('Add a New Sensor', async () => {
    await page.getByRole('link', { name: 'History' }).click({timeout: 60_000});
    await page.getByRole('tab', { name: 'Sensors' }).click();
    await page.getByRole('button', { name: 'Add Sensor' }).click();
    await page.locator('#Sensor_NameField').fill(uniqueName, {timeout: 60_000});
    await page.locator('#Sensor_MountHeightField').fill('3');
    await page.locator('#Sensor_LatitudeField').fill('14.597447314583');
    await page.locator('#Sensor_LongitudeField').fill('121.03924222948');
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
  const sensorCard = page.locator('div.border').filter({ hasText: uniqueName });
  await sensorCard.getByRole('button', { name: 'Details' }).click({timeout: 60_000}); 
  await expect(page.locator('#Sensor_NameField')).toHaveValue(uniqueName, {timeout: 60_000});
  await expect(page.locator('#Sensor_MountHeightField')).toHaveValue('3');
  await expect(page.locator('#Sensor_LatitudeField')).toHaveValue('14.597447314583');
  await expect(page.locator('#Sensor_LongitudeField')).toHaveValue('121.03924222948');
  await expect(page.locator('#Sensor_MountLoc')).toHaveValue('Barangay Greenhills', {timeout: 30_000});
  await expect(page.locator('#Sensor_AddressField')).toHaveValue('Wilson Street Bridge');
  await expect(page.locator('#Sensor_YellowField')).toHaveValue('1');
  await expect(page.locator('#Sensor_OrangeField')).toHaveValue('2');
  await expect(page.locator('#Sensor_RedField')).toHaveValue('2.5');
  await expect(page.locator('#Sensor_RegisteredBy')).toHaveValue('Barangay Greenhills');
 })

 await test.step ('Edit Sensor Details', async () => {
  await page.locator('#Sensor_EditBtn').click();
  await page.locator('#Sensor_OrangeField').fill('1.5', {timeout: 60_000});
  await page.locator('#Sensor_NameField').fill(uniqueName + ' Edited');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Sensor is successfully')).toBeVisible({timeout: 60_000});
  await expect(page.locator('#Sensor_NameField')).toHaveValue(uniqueName + ' Edited', {timeout:60_000});
  await expect(page.locator('#Sensor_OrangeField')).toHaveValue('1.5');
 })

await test.step ('Check Sensor Logs', async () => {
  await page.locator('#Navbar_Back').click();
  await page.getByRole('tab', { name: 'Sensors' }).click();
  const sensorCard = page.locator('div.border').filter({ hasText: 'Seeded Sensor' });
  await sensorCard.getByRole('button', { name: 'Details' }).click({timeout: 60_000});
  await page.getByRole('button', { name: 'Sensor Logs' }).click({timeout: 60_000});
  const logCard = page.locator('div.border').filter({ hasText: 'Water Level' }).first();
  await expect(logCard).toBeVisible({timeout: 30_000});
})

await test.step ('Delete Sensor', async () => {
  await page.locator('#Navbar_Back').click();
  await page.locator('#Navbar_Back').click();
  await page.getByRole('tab', { name: 'Sensors' }).click();
  const sensorCard = page.locator('div.border').filter({ hasText: uniqueName + ' Edited' });
  await sensorCard.getByRole('button', { name: 'Details' }).click({timeout: 60_000}); 

  await page.locator('#Sensor_DelBtn').click();
  await page.locator('#Sensors_DeacBtn').click();
  await expect(page.getByText('Sensor successfully deleted!')).toBeVisible({timeout: 60_000});
  await page.getByRole('tab', { name: 'Sensors' }).click();
  await expect(sensorCard.getByText('Inactive')).toBeVisible({timeout: 60_000}); 
 })
})
