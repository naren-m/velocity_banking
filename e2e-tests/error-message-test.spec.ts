import { test, expect } from '@playwright/test';

test.describe('Error Message Display Test', () => {
  test('should show proper error message for missing financial data', async ({ page }) => {
    // Go directly to optimal strategy page
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Should redirect to login if not authenticated, then let's login
    if (page.url().includes('localhost:3000/')) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'test123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    }
    
    // Now navigate to optimal strategy
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Mock the API to return the expected error
    await page.route('**/api/helocs/calculate-optimal-strategies', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Monthly income and expenses are required' })
      });
    });
    
    // Reload to trigger the API call
    await page.reload();
    
    // Wait for error to appear
    await page.waitForSelector('text="Financial Information Required"', { timeout: 10000 });
    
    // Check for the enhanced error message
    await expect(page.locator('text="Financial Information Required"')).toBeVisible();
    await expect(page.locator('text="To calculate optimal velocity banking strategies"')).toBeVisible();
    await expect(page.locator('text="Monthly gross income"')).toBeVisible();
    await expect(page.locator('text="Add Financial Information"')).toBeVisible();
    
    console.log('✅ Enhanced error message displayed correctly');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/enhanced-error-message.png', fullPage: true });
  });
});