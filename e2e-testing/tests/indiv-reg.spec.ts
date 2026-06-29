import { test, expect } from '@playwright/test';
import { Chance } from 'chance';

const chance = new Chance();

// Generate credentials 
const uniqueTag = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' });
const password = 'T3st1ng!';
let testEmail = ''; 

test.describe.serial('User Registration and Account Lifecycle', () => {
  let sharedPage; // Share the same page instance across tests

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    
    const namespace = process.env.TESTMAIL_NAMESPACE;
    testEmail = `${namespace}.pw-${uniqueTag}@inbox.testmail.app`;

    // Catch browser-side console errors
    sharedPage.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));
  });

  // test.afterAll(async () => {
  //   await sharedPage.close();
  // });

  test('Register and Verify User', async ({ request }) => {
    test.setTimeout(240_000); 
    const page = sharedPage; // Use the shared page
    const namespace = process.env.TESTMAIL_NAMESPACE;
    const apiKey = process.env.TESTMAIL_APIKEY;
    const startTimestamp = Date.now();

    await test.step('View App in Guest Mode', async () => {
      await page.goto('/');
      await expect(page.getByRole('button', { name: 'Sign-in' })).toBeVisible();
      await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
    });

    await test.step('Register User', async () => {
      await page.getByRole('button', { name: 'Sign-in' }).click();
      await page.getByRole('link', { name: 'Register Now' }).click(); 
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('button', { name: 'Get Started' }).click();  

      await expect(page.getByRole('heading', { name: 'Create your Account' })).toBeVisible();
      await page.locator('#RegisForm_LNfield').fill('Tester');
      await page.locator('#RegisForm_FNfield').fill('Playwright');
      await page.locator('#RegisForm_EMAILfield').fill(testEmail);
      await page.locator('#RegisForm_CITYfield').click();
      await page.getByText('Outside San Juan').click({timeout: 30_000});
      await page.locator('#RegisForm_BRGYfield').click();
      await page.getByText('Unregistered Barangay').click({timeout: 30_000});
      await page.locator('#RegisForm_PWfield').fill(password);
      await page.locator('#RegisForm_CONFIRMPWfield').fill(password);
      await page.getByRole('button', { name: 'Next' }).click(); 
      await page.getByRole('button', { name: 'Skip' }).click(); 

      await expect(page.locator('div').filter({ hasText: 'Customize your profile!' }).nth(3)).toBeVisible();
      await page.getByRole('button', { name: 'Generate New Avatar' }).click();
      await expect(page.locator('#Profile_Form').getByRole('img')).toBeVisible();

      await page.locator('#Profile_UsernameField').fill(`tester-pw-${uniqueTag}`);
      await page.getByRole('button', { name: 'Next' }).click();

      await expect(page.getByText('A few reminders')).toBeVisible();
      await page.getByRole('checkbox').click();
      await page.locator('#Permissions_SubmitBtn').click();
    });

    await test.step('Verify Email', async () => {
      await expect(page.getByText(`An email was sent to ${namespace}`)).toBeVisible({timeout: 60_000});

      const endpoint = `https://api.testmail.app/api/json?apikey=${apiKey}&namespace=${namespace}&tag=pw-${uniqueTag}&timestamp_from=${startTimestamp}&livequery=true`;
      const response = await request.get(endpoint);
      expect(response.ok()).toBeTruthy();
      
      const inbox = await response.json();
      expect(inbox.count).toBe(1); 

      const receivedEmailText = inbox.emails[0].text;
      const linkRegex = /(https?:\/\/[^\s]+mode=verifyEmail[^\s]*)/i;
      const match = receivedEmailText.match(linkRegex);
      let verificationLink = match ? match[1] : null;

      if (verificationLink) {
        verificationLink = verificationLink.replace(/[.,)\]]+$/, ''); 
        const context = page.context(); 
        const newTab = await context.newPage(); 
        await newTab.goto(verificationLink); 
        await expect(newTab.getByText('Your email has been verified')).toBeVisible(); 
        await newTab.close();
      } else {
        throw new Error('Verification link not found in text email body.');
      }
      
      await page.getByRole('button', { name: 'Verify Email' }).click();
      await page.getByRole('button', { name: 'Get Started!' }).click();
    });

    await test.step('Log In New User', async () => {
      await expect(page.locator('#LogIn_PasswordField')).toBeVisible();
      await page.locator('#LogIn_EmailField').fill(testEmail);
      await page.locator('#LogIn_PasswordField').fill(password);
      await page.getByRole('button', { name: 'Log In' }).click();
      
      // Ensure we are fully logged in before this test block finishes
      await expect(page.getByText('You\'re Logged In!')).toBeVisible();
      await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
    });

  
  });

  // test('Change User Password', async () => {
  //   const page = sharedPage; // Continues from page of previous test

  //   await test.step('Verify Details and Deactivate', async () => {
  //     await page.getByRole('link', { name: 'Settings' }).click();
  //     await page.getByRole('link', { name: 'My Account' }).click();
      
  //     await expect(page.locator('#Profile_Username')).toBeVisible({timeout: 30_000});
  //     await expect(page.locator('#Profile_Username')).toHaveValue(`tester-pw-${uniqueTag}`);
  //     await expect(page.locator('#Profile_Firstname')).toHaveValue('Playwright');
  //     await expect(page.locator('#Profile_Lastname')).toHaveValue('Tester');
  //     await expect(page.locator('#Profile_Email')).toHaveValue(testEmail);
  //     await expect(page.getByRole('textbox', { name: 'Unregistered Barangay, Outside San Juan' })).toBeVisible();

  //     // Deactivate user
  //     await page.locator('#Profile_DeacBtn').click();
  //     // await page.locator('#Profile_DeacModalBtn').click();
  //   });
  // });

  // test('Deactivate Registered User Account', async () => {
  //   const page = sharedPage; // Continues from page of previous test

  //   await test.step('Verify Details and Deactivate', async () => {
  //     await page.getByRole('link', { name: 'Settings' }).click();
  //     await page.getByRole('link', { name: 'My Account' }).click();
      
  //     await expect(page.locator('#Profile_Username')).toBeVisible({timeout: 30_000});
  //     await expect(page.locator('#Profile_Username')).toHaveValue(`tester-pw-${uniqueTag}`);
  //     await expect(page.locator('#Profile_Firstname')).toHaveValue('Playwright');
  //     await expect(page.locator('#Profile_Lastname')).toHaveValue('Tester');
  //     await expect(page.locator('#Profile_Email')).toHaveValue(testEmail);
  //     await expect(page.getByRole('textbox', { name: 'Unregistered Barangay, Outside San Juan' })).toBeVisible();

  //     // Deactivate user
  //     await page.locator('#Profile_DeacBtn').click();
  //     // await page.locator('#Profile_DeacModalBtn').click();
  //   });
  // });
});