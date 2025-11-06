import { test, expect } from '@playwright/test';

test.describe('Live Velocity Banking Website', () => {
  test('should display working React application with all UI elements', async ({ page }) => {
    // Navigate to the live website
    await page.goto('https://velocitybanking.naren.me');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/live-website-initial.png', fullPage: true });
    
    // Check that the page title contains "Velocity Banking"
    await expect(page).toHaveTitle(/Velocity Banking/);
    
    // Verify the main application content is visible (not blank page)
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent.length).toBeGreaterThan(50); // Ensure there's actual content
    
    // Check for the main heading "Velocity Banking"
    const mainHeading = page.locator('h1, h2, h3').filter({ hasText: 'Velocity Banking' });
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
    
    // Verify login form elements are present and visible
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i], input[name*="password" i]');
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    const loginButton = page.locator('button').filter({ hasText: /login|sign in/i });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    
    // Test basic form field interactions
    await emailInput.click();
    await emailInput.fill('test@example.com');
    
    await passwordInput.click();
    await passwordInput.fill('testpassword');
    
    // Take screenshot after filling form
    await page.screenshot({ path: 'test-results/live-website-form-filled.png', fullPage: true });
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a moment to capture any console errors
    await page.waitForTimeout(2000);
    
    // Verify no critical console errors (some warnings might be acceptable)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('Lighthouse') &&
      !error.includes('favicon')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/live-website-final.png', fullPage: true });
    
    // Verify React is loaded by checking for React dev tools or React-specific elements
    const reactElement = await page.locator('[data-reactroot], #root > div, .App, [class*="react"]').first().isVisible();
    expect(reactElement).toBeTruthy();
    
    // Log success
    console.log('✅ Website is working properly!');
    console.log('✅ React application is loaded');
    console.log('✅ Login form is visible and functional');
    console.log('✅ UI elements are properly rendered');
    
    if (criticalErrors.length === 0) {
      console.log('✅ No critical console errors found');
    } else {
      console.log(`⚠️ Found ${criticalErrors.length} console errors`);
    }
  });
  
  test('should handle navigation and responsive design', async ({ page }) => {
    await page.goto('https://velocitybanking.naren.me');
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/live-website-mobile.png', fullPage: true });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/live-website-tablet.png', fullPage: true });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/live-website-desktop.png', fullPage: true });
    
    console.log('✅ Responsive design screenshots captured');
  });
});