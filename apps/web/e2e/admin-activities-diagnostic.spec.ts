import { test, expect } from '@playwright/test';

test.describe('Admin Activities Diagnostic', () => {
  test('take screenshot of admin inventory page', async ({ page }) => {
    // Set admin auth
    await page.addInitScript(() => {
      localStorage.setItem('adminApiKey', 'dev-admin-key-12345');
      sessionStorage.setItem('adminApiKey', 'dev-admin-key-12345');
    });

    // Go to login and authenticate
    await page.goto('/admin/login');

    const apiKeyInput = page.locator('input[type="text"], input[placeholder*="key" i]').first();
    if (await apiKeyInput.count() > 0) {
      await apiKeyInput.fill('dev-admin-key-12345');

      const submitButton = page.locator('button').filter({
        hasText: /Login|Submit|Verify|Access/i
      }).first();

      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Navigate to inventory
    await page.goto('/admin/inventory/1');
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot
    await page.screenshot({ path: 'admin-inventory-screenshot.png', fullPage: true });
    console.log('✓ Screenshot taken: admin-inventory-screenshot.png');

    // Log page structure
    const title = await page.title();
    const url = page.url();
    const h1 = await page.locator('h1').first().textContent().catch(() => 'N/A');
    const pageContent = await page.content();

    console.log('\n=== Page Info ===');
    console.log(`URL: ${url}`);
    console.log(`Title: ${title}`);
    console.log(`H1: ${h1}`);

    // Check what sections are on the page
    const hasInput = pageContent.includes('input');
    const hasButton = pageContent.includes('button');
    const hasForm = pageContent.includes('form');
    const hasActivity = pageContent.includes('activity') || pageContent.includes('Activity');

    console.log('\n=== Page Elements ===');
    console.log(`Has inputs: ${hasInput}`);
    console.log(`Has buttons: ${hasButton}`);
    console.log(`Has forms: ${hasForm}`);
    console.log(`Has activity references: ${hasActivity}`);

    // List all text content on the page (first 2000 chars)
    const bodyText = await page.locator('body').textContent();
    if (bodyText) {
      console.log('\n=== Page Text (First 1000 chars) ===');
      console.log(bodyText.substring(0, 1000));
    }
  });
});
