import { test, expect } from '@playwright/test';
import { Chance } from 'chance';

const chance = new Chance();

test('End-to-End Individual User Account Lifecycle', async ({ page, request }) => {
  test.setTimeout(300_000); 

  // Generate credentials 
  const namespace = process.env.TESTMAIL_NAMESPACE;
  const apiKey = process.env.TESTMAIL_APIKEY;

  const startTimestamp = Date.now();
  const uniqueTag = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' });   // generate a unique tag for this test run
  const testEmail = `${namespace}.pw-${uniqueTag}@inbox.testmail.app`;   // construct the dynamic email address
  const password = 'T3st1ng!';
  const newPassword = 'changeP@55!';

  page.on('pageerror', exception => console.log(`BROWSER UNCAUGHT EXCEPTION: ${exception.message}`));

  await test.step('View App in Guest Mode', async () => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign-in' })).toBeVisible();
    await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
  });

  await test.step('Register User', async () => {
    // Go through onboarding screens
    await page.getByRole('button', { name: 'Sign-in' }).click();
    await page.getByRole('link', { name: 'Register Now' }).click(); 
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Get Started' }).click();  

    // Fill in form
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
    await page.getByRole('button', { name: 'Skip' }).click();   // skips phone number

    // Generate Avatar
    await expect(page.locator('div').filter({ hasText: 'Customize your profile!' }).nth(3)).toBeVisible();
    await page.getByRole('button', { name: 'Generate New Avatar' }).click();
    await expect(page.locator('#Profile_Form').getByRole('img')).toBeVisible();

    // Fill in Username
    await page.locator('#Profile_UsernameField').fill(`tester-pw-${uniqueTag}`);
    await page.getByRole('button', { name: 'Next' }).click();

    // Agree with permissions
    await expect(page.getByText('A few reminders')).toBeVisible();
    await page.getByRole('checkbox').click();
    await page.locator('#Permissions_SubmitBtn').click();
  }); 

  await test.step('Verify Email', async () => {
    await expect(page.getByText(`An email was sent to ${namespace}`)).toBeVisible({timeout: 60_000});

    // Fetch verification email from Testmail
    const endpoint = `https://api.testmail.app/api/json?apikey=${apiKey}&namespace=${namespace}&tag=pw-${uniqueTag}&timestamp_from=${startTimestamp}&livequery=true`;
    const response = await request.get(endpoint);
    expect(response.ok()).toBeTruthy();
    
    const inbox = await response.json();
    expect(inbox.count).toBe(1);   // confirm an email was received 

    // Find account verification link
    const receivedEmailText = inbox.emails[0].text;
    const linkRegex = /(https?:\/\/[^\s]+mode=verifyEmail[^\s]*)/i;   // clean link
    const match = receivedEmailText.match(linkRegex);
    let verificationLink = match ? match[1] : null;

    if (verificationLink) {
      verificationLink = verificationLink.replace(/[.,)\]]+$/, ''); 
      const context = page.context(); 
      const newTab = await context.newPage(); 
      await newTab.goto(verificationLink);   // open Firebase link
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
    
    // Ensure app loads when logged in
    await expect(page.getByText('You\'re Logged In!')).toBeVisible();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
  });

  await test.step('Verify Registration Details',async () => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/Settings$/);
    await page.getByRole('link', { name: 'My Account' }).click();
    await expect(page).toHaveURL(/\/Profile$/);

    await expect(page.locator('#Profile_Username')).toBeVisible({timeout: 30_000});
    await expect(page.locator('#Profile_Username')).toHaveValue(`tester-pw-${uniqueTag}`);
    await expect(page.locator('#Profile_Firstname')).toHaveValue('Playwright');
    await expect(page.locator('#Profile_Lastname')).toHaveValue('Tester');
    await expect(page.locator('#Profile_Email')).toHaveValue(testEmail);
    await expect(page.getByRole('textbox', { name: 'Unregistered Barangay, Outside San Juan' })).toBeVisible();
  });

  await test.step('Change Password',async () => {
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await page.locator('#Profile_CurrPWField').click();
    await page.locator('#Profile_CurrPWField').fill(password);
    await page.locator('#Profile_NewPWField').click();
    await page.locator('#Profile_NewPWField').fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Password has been updated!')).toBeVisible({timeout: 30_000});
  });

  await test.step('Log out', async () => {
    await page.locator('#Navbar_Back').click();
    await page.locator('#Settings_LogOutBtn').click();
    await expect(page.getByText('You\'re logged out!')).toBeVisible();
    await expect(page).toHaveURL(/\/Login$/);
  })

  await test.step('Log In Using New Password', async () => {    
    await page.locator('#LogIn_EmailField').fill(testEmail);
    await page.locator('#LogIn_PasswordField').fill(newPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    
    await expect(page.getByText('You\'re Logged In!')).toBeVisible();
    await expect(page.getByText('Pins Generated!')).toBeVisible({timeout: 60_000});
    await expect(page).toHaveURL(/\/map$/);
  });

  await test.step('Deactivate User',async () => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'My Account' }).click();

    await page.locator('#Profile_DeacBtn').click();
    await page.locator('#Profile_DeacModalBtn').click();
    await expect(page.getByText('Account Deactivated')).toBeVisible({timeout: 30_000});
    await expect(page).toHaveURL(/\/Login$/);
  });

  await test.step('Verify Blocked Log In Using Deactivated Account', async () => {
    await page.locator('#LogIn_EmailField').fill(testEmail);
    await page.locator('#LogIn_PasswordField').fill(newPassword);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('This account is deactivated')).toBeVisible({timeout: 30_000});
    await expect(page).toHaveURL(/\/Login$/);
  });
});