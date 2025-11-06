import { test, expect } from '@playwright/test';

test.describe('Complete User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should complete login and show financial data missing warning', async ({ page }) => {
    console.log('=== Testing scenario with missing financial data ===');
    
    // Step 1: Login with test user
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ Login successful');
    
    // Step 2: Clear financial data from the mortgage to simulate missing data
    await page.evaluate(() => {
      const mortgageStore = JSON.parse(localStorage.getItem('mortgage-storage') || '{}');
      if (mortgageStore.state && mortgageStore.state.mortgage) {
        mortgageStore.state.mortgage.monthlyIncome = null;
        mortgageStore.state.mortgage.monthlyExpenses = null;
        localStorage.setItem('mortgage-storage', JSON.stringify(mortgageStore));
      }
    });
    
    // Refresh to apply the changes
    await page.reload();
    await page.waitForSelector('h1');
    
    console.log('✅ Cleared financial data from localStorage');
    
    // Step 3: Verify the financial profile warning is shown
    await expect(page.locator('text="Complete Your Financial Profile"')).toBeVisible();
    await expect(page.locator('text="Add your monthly income and expenses"')).toBeVisible();
    console.log('✅ Financial profile warning displayed');
    
    // Step 4: Verify "View Optimal Strategies" button is NOT in header
    const headerOptimalButton = page.locator('div:has(h1) >> text="View Optimal Strategies"');
    await expect(headerOptimalButton).not.toBeVisible();
    console.log('✅ Header optimal strategies button correctly hidden');
    
    // Step 5: Verify Quick Actions shows "Complete Financial Profile" instead of "View Optimal Strategies"
    await expect(page.locator('text="Complete Financial Profile"')).toBeVisible();
    const quickActionsOptimalButton = page.locator('.flex-wrap >> text="View Optimal Strategies"');
    await expect(quickActionsOptimalButton).not.toBeVisible();
    console.log('✅ Quick actions shows completion prompt instead of optimal strategies');
    
    // Step 6: Try to navigate directly to optimal-strategy page
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Should see the detailed error page with helpful information
    await expect(page.locator('text="Financial Information Required"')).toBeVisible();
    await expect(page.locator('text="To calculate optimal velocity banking strategies"')).toBeVisible();
    await expect(page.locator('text="Monthly gross income"')).toBeVisible();
    await expect(page.locator('text="Monthly expenses"')).toBeVisible();
    
    console.log('✅ Optimal strategy page shows helpful error message');
    
    // Take screenshot of the error page
    await page.screenshot({ path: 'test-results/financial-info-required.png', fullPage: true });
  });

  test('should complete full journey with financial data', async ({ page }) => {
    console.log('=== Testing scenario with complete financial data ===');
    
    // Step 1: Login with test user (who has financial data)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ Login successful');
    
    // Step 2: Verify financial profile section is visible
    await expect(page.locator('text="Your Financial Profile"')).toBeVisible();
    await expect(page.locator('text="Monthly Income"')).toBeVisible();
    await expect(page.locator('text="$8,000"')).toBeVisible();
    console.log('✅ Financial profile section displayed correctly');
    
    // Step 3: Verify "View Optimal Strategies" button IS available in header
    const headerOptimalButton = page.locator('div:has(h1) >> text="View Optimal Strategies"');
    await expect(headerOptimalButton).toBeVisible();
    console.log('✅ Header optimal strategies button available');
    
    // Step 4: Verify Quick Actions shows "View Optimal Strategies"
    const quickActionsOptimalButton = page.locator('.flex-wrap >> text="View Optimal Strategies"');
    await expect(quickActionsOptimalButton).toBeVisible();
    console.log('✅ Quick actions shows optimal strategies button');
    
    // Step 5: Navigate to optimal strategy page
    await headerOptimalButton.click();
    await page.waitForURL('**/optimal-strategy');
    
    // Wait for loading to complete
    await page.waitForSelector('text="Optimal Payoff Strategies"', { timeout: 10000 });
    
    // Verify successful loading
    await expect(page.locator('text="Optimal Payoff Strategies"')).toBeVisible();
    await expect(page.locator('text="Recommended Strategy"')).toBeVisible();
    await expect(page.locator('text="Your Financial Profile"')).toBeVisible();
    await expect(page.locator('text="Net Cashflow"')).toBeVisible();
    
    console.log('✅ Optimal strategy page loaded successfully');
    
    // Take screenshot of successful page
    await page.screenshot({ path: 'test-results/optimal-strategy-success.png', fullPage: true });
  });

  test('should handle API error gracefully', async ({ page }) => {
    console.log('=== Testing API error handling ===');
    
    // Step 1: Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Step 2: Mock API failure
    await page.route('**/api/helocs/calculate-optimal-strategies', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Step 3: Navigate to optimal strategy
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Should show error message
    await expect(page.locator('text="Error"')).toBeVisible();
    await expect(page.locator('text="Internal server error"')).toBeVisible();
    await expect(page.locator('text="Back to Dashboard"')).toBeVisible();
    
    console.log('✅ API error handled gracefully');
  });

  test('should provide navigation back to dashboard from all error states', async ({ page }) => {
    console.log('=== Testing navigation from error states ===');
    
    // Step 1: Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Step 2: Clear financial data and go to optimal strategy
    await page.evaluate(() => {
      const mortgageStore = JSON.parse(localStorage.getItem('mortgage-storage') || '{}');
      if (mortgageStore.state && mortgageStore.state.mortgage) {
        mortgageStore.state.mortgage.monthlyIncome = null;
        mortgageStore.state.mortgage.monthlyExpenses = null;
        localStorage.setItem('mortgage-storage', JSON.stringify(mortgageStore));
      }
    });
    
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Step 3: Click "Back to Dashboard" button
    await page.click('text="Back to Dashboard"');
    await page.waitForURL('**/dashboard');
    
    // Verify we're back on dashboard
    await expect(page.locator('text="Welcome back, Test User!"')).toBeVisible();
    
    console.log('✅ Navigation back to dashboard works');
  });
});