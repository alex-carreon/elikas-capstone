import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.testing') });

// Determine base URL dynamically 
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173'; // find playwright base url, use local if not defined (local test)
const shouldRunLocalServers = BASE_URL.includes('127.0.0.1') || BASE_URL.includes('localhost'); // run servers if testing locally

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    launchOptions: {
      env: {
        ...process.env,
        FIREBASE_APP_CHECK_DEBUG_TOKEN: process.env.FIREBASE_APP_CHECK_DEBUG,
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    /* Desktop */
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
       },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
       },
    },

    /* Android */
    {
      name: 'mobile-android-standard',
      use: {
        ...devices['Pixel 7'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
        },
    },
    {
      name: 'mobile-android-galaxy',
      use: { ...devices['Galaxy S9+'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
       },
    },

    /* iOS */
    {
      name: 'mobile-ios-standard',
      use: { ...devices['iPhone 15'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
       },
    },
    {
      name: 'mobile-ios-small',
      use: { ...devices['iPhone SE'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
       },
    },
    {
      name: 'mobile-ios-max',
      use: { ...devices['iPhone 15 Pro Max'],
        permissions: ['geolocation'],
        geolocation: { latitude: 14.6049833, longitude: 121.0293302 }
       },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: shouldRunLocalServers ? [
    {
      name: 'backend',
      command: 'cd ../eLikas_backend && php artisan serve', 
      url: 'http://127.0.0.1:8000/api/test',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000, 
    },
    {
      name: 'frontend',
      command: 'cd ../elikas-frontend && npm run dev', 
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // Gives the server up to 2 minutes to boot
    }
  ] :  undefined // if testing public deployment, do not boot
});
