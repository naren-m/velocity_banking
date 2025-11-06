import { test, expect } from '@playwright/test';

test.describe('Optimal Strategy Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test('should complete full login to optimal strategy journey', async ({ page }) => {
    // Step 1: Login
    console.log('Starting login flow...');
    await expect(page.locator('h1')).toContainText('Velocity Banking');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    console.log('Successfully logged in and navigated to dashboard');
    
    // Step 2: Verify dashboard loads with mortgage and HELOC data
    await expect(page.locator('h1')).toContainText('Welcome back, Test User!');
    
    // Wait for mortgage data to load
    await expect(page.locator('text="Current Balance"')).toBeVisible();
    await expect(page.locator('text="$350,000"')).toBeVisible();
    
    // Check for HELOC section
    await expect(page.locator('text="HELOC Status"')).toBeVisible();
    await expect(page.locator('text="$75,000"')).toBeVisible(); // Credit limit
    
    // Step 3: Navigate to optimal strategy
    console.log('Navigating to optimal strategy page...');
    const optimalStrategyButton = page.locator('text="View Optimal Strategies"');
    await expect(optimalStrategyButton).toBeVisible();
    await optimalStrategyButton.click();
    
    // Wait for navigation
    await page.waitForURL('**/optimal-strategy');
    console.log('Navigated to optimal strategy page');
    
    // Step 4: Check for loading state and then results
    await expect(page.locator('text="Calculating optimal strategies..."')).toBeVisible();
    console.log('Loading state visible');
    
    // Wait for loading to complete and check for error or success
    await page.waitForSelector('text="Your Financial Profile"', { timeout: 10000 });
    console.log('Financial profile section loaded');
    
    // Check for the error message we're investigating
    const errorExists = await page.locator('text="Monthly income and expenses are required"').count() > 0;
    if (errorExists) {
      console.log('ERROR FOUND: Monthly income and expenses are required');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'optimal-strategy-error.png', fullPage: true });
      
      // Log current mortgage data that's being used
      const mortgageData = await page.evaluate(() => {
        return (window as any).localStorage.getItem('mortgage-storage');
      });
      console.log('Mortgage data in localStorage:', mortgageData);
      
      test.fail('Found the error: Monthly income and expenses are required');
    }
    
    // Step 5: Verify successful loading of optimal strategies
    await expect(page.locator('text="Optimal Payoff Strategies"')).toBeVisible();
    await expect(page.locator('text="Recommended Strategy"')).toBeVisible();
    await expect(page.locator('text="Net Cashflow"')).toBeVisible();
    
    console.log('Optimal strategy page loaded successfully');
    
    // Take a screenshot of the successful page
    await page.screenshot({ path: 'optimal-strategy-success.png', fullPage: true });
  });

  test('should handle monthly income/expenses missing scenario', async ({ page }) => {
    // First login normally
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Manipulate the mortgage data to remove income/expenses
    await page.evaluate(() => {
      const mortgageStore = JSON.parse(localStorage.getItem('mortgage-storage') || '{}');
      if (mortgageStore.state && mortgageStore.state.mortgage) {
        mortgageStore.state.mortgage.monthlyIncome = null;
        mortgageStore.state.mortgage.monthlyExpenses = null;
        localStorage.setItem('mortgage-storage', JSON.stringify(mortgageStore));
      }
    });
    
    // Navigate to optimal strategy
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Should see the error message
    await expect(page.locator('text="Monthly income and expenses are required"')).toBeVisible();
    console.log('Confirmed error appears when income/expenses are missing');
  });

  test('should debug network requests', async ({ page }) => {
    // Monitor network requests
    const requests: any[] = [];
    const responses: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });
    
    // Complete login flow
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to optimal strategy
    await page.goto('http://localhost:3000/optimal-strategy');
    
    // Wait a bit for all requests to complete
    await page.waitForTimeout(3000);
    
    console.log('Network Requests:', JSON.stringify(requests.filter(r => r.url.includes('api')), null, 2));
    console.log('Network Responses:', JSON.stringify(responses.filter(r => r.url.includes('api')), null, 2));
  });
});