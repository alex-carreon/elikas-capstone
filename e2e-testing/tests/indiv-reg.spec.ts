import { test, expect } from '@playwright/test';
import { Chance } from 'chance';

const chance = new Chance();

test('End-to-End Registration and Email Verification', async ({ page, request }) => {
  test.setTimeout(360_000); 

  const namespace = process.env.TESTMAIL_NAMESPACE;
  const apiKey = process.env.TESTMAIL_APIKEY;

  const startTimestamp = Date.now();
  const uniqueTag = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' });   // generate a unique tag for this test run
  const testEmail = `${namespace}.pw-${uniqueTag}@inbox.testmail.app`;   // construct the dynamic email address
  const password = 'T3st1ng!';

  // Catch browser-side console errors/logs
  //page.on('console', msg => console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await page.goto('/');

  // Verify user is logged out upon first starting the app
//   await expect(page.getByRole('button', { name: 'Sign-in' })).toBeVisible();
  await expect(page.getByText('Pins Generated!')).toBeVisible();

//   await page.waitForResponse(
//     response => response.url().includes('/api/flood-paths') && response.status() === 200,
//     { timeout: 30_000 }   // wait for pins to load
//   );   

  // Start Registration
  await page.getByRole('button', { name: 'Sign-in' }).click();
  await page.getByRole('link', { name: 'Register Now' }).click(); 
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Get Started' }).click();  

  // Fill out registration form
  await expect(page.getByRole('heading', { name: 'Create your Account' })).toBeVisible();
  await page.locator('#RegisForm_LNfield').fill('Tester');
  await page.locator('#RegisForm_FNfield').fill('Playwright');
  await page.locator('#RegisForm_EMAILfield').fill(testEmail);
  await page.locator('#RegisForm_CITYfield').click();
  await page.getByText('Outside San Juan').click();
  await page.waitForResponse(
    response => response.url().includes('/api/locations/barangays') && response.status() === 200,
    { timeout: 30_000 }   // wait for brgy dropdown
  );   
  await page.locator('#RegisForm_BRGYfield').click();
  await page.getByText('Unregistered Barangay').click();
  await page.locator('#RegisForm_PWfield').fill(password);
  await page.locator('#RegisForm_CONFIRMPWfield').fill(password);
  await page.getByRole('button', { name: 'Next' }).click(); 
  await page.getByRole('button', { name: 'Skip' }).click(); // skips phone number

  // Avatar generation
  await expect(page.locator('div').filter({ hasText: 'Customize your profile!' }).nth(3)).toBeVisible();
  await page.getByRole('button', { name: 'Generate New Avatar' }).click();
  await expect(page.locator('#Profile_Form').getByRole('img')).toBeVisible();

  // Fill in username 
  await page.locator('#Profile_UsernameField').fill(`tester-pw-${uniqueTag}`);
  await page.getByRole('button', { name: 'Next' }).click();

  // Agree with terms and conditions
  await expect(page.getByText('A few reminders')).toBeVisible();
  await page.getByRole('checkbox').click();
  await page.locator('#Permissions_SubmitBtn').click();

  // Email verification
  await expect(page.getByText(`An email was sent to ${namespace}`)).toBeVisible({timeout: 30_000});

  // Fetch email from testmail
  // Using livequery=true tells Testmail to wait until the email actually arrives
  const endpoint = `https://api.testmail.app/api/json?apikey=${apiKey}&namespace=${namespace}&tag=pw-${uniqueTag}&timestamp_from=${startTimestamp}&livequery=true`;
  
  const response = await request.get(endpoint);
  expect(response.ok()).toBeTruthy();
  
  const inbox = await response.json();
  expect(inbox.count).toBe(1);   // confirm email was received

  const receivedEmailText = inbox.emails[0].text;

  // Extract verification link using regex
  const linkRegex = /(https?:\/\/[^\s]+mode=verifyEmail[^\s]*)/i;
  const match = receivedEmailText.match(linkRegex);
  let verificationLink = match ? match[1] : null;

  if (verificationLink) {
    verificationLink = verificationLink.replace(/[.,)\]]+$/, '');    // clean link
    
    const context = page.context();   // get context of existing page
    const newTab = await context.newPage();   // open a new tab
    await newTab.goto(verificationLink);   // open the firebase link
    await expect(newTab.getByText('Your email has been verified')).toBeVisible();   // wait for successful verification
    
    await newTab.close();
  } else {
    throw new Error('Verification link not found in text email body.');
  }
  
  await page.getByRole('button', { name: 'Verify Email' }).click();
  await page.getByRole('button', { name: 'Get Started!' }).click();

  // Log In
  await expect(page.locator('#LogIn_PasswordField')).toBeVisible();
  await page.locator('#LogIn_EmailField').fill(testEmail);
  await page.locator('#LogIn_PasswordField').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();

  try {
    await expect(page.getByText('You\'re Logged In!')).toBeVisible();
    await page.waitForResponse(
      response => response.url().includes('/api/flood-paths') && response.status() === 200,
      { timeout: 30_000 }
    );  

     // Verify Correct Registration Details
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'My Account' }).click();
    await page.waitForResponse(
      response => response.url().includes('/api/profile') && response.status() === 200,
      { timeout: 30_000 } 
    );
    await expect(page.locator('#Profile_Username')).toBeVisible();
    await expect(page.locator('#Profile_Username')).toHaveValue(`tester-pw-${uniqueTag}`);
    await expect(page.locator('#Profile_Firstname')).toHaveValue('Playwright');
    await expect(page.locator('#Profile_Lastname')).toHaveValue('Tester');
    await expect(page.locator('#Profile_Email')).toHaveValue(testEmail);
    await expect(page.getByRole('textbox', { name: 'Unregistered Barangay, Outside San Juan' })).toBeVisible();
  }
  finally {
    // Deactivate user
    await page.locator('#Profile_DeacBtn').click();
    // await expect(page.getByText('Account Deactivated!')).toBeVisible({timeout: 30_000});
    // await page.close();
  }
});
