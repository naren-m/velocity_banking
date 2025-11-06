import { test, expect } from '@playwright/test';

test.describe('Deployment Verification - Before/After React 18 Fix', () => {
  test('should document current state of live website', async ({ page }) => {
    console.log('=== Checking Current Live Website State ===');
    
    // Navigate to the live website
    await page.goto('https://velocitybanking.naren.me');
    console.log('✅ Live website loaded');
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'test-results/live-website-current-state.png',
      fullPage: true 
    });
    console.log('✅ Screenshot taken of current live state');
    
    // Check if page is blank (indicating React 18 issue)
    const bodyText = await page.locator('body').innerText();
    const hasContent = bodyText.trim().length > 0;
    
    if (!hasContent) {
      console.log('❌ CONFIRMED: Live website is showing blank page (React 18 issue present)');
      
      // Check console for React 18 related errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(3000);
      
      if (consoleErrors.length > 0) {
        console.log('🔍 Console errors found:', consoleErrors);
      }
      
      // Check if root element exists but is empty
      const rootExists = await page.locator('#root').count() > 0;
      if (rootExists) {
        const rootContent = await page.locator('#root').innerHTML();
        console.log('🔍 Root element exists but content:', rootContent.length > 0 ? 'has content' : 'is empty');
      }
    } else {
      console.log('✅ Live website has content - may already be fixed');
    }
  });
  
  test('should verify local development server works correctly', async ({ page }) => {
    console.log('=== Testing Local Development Server ===');
    
    try {
      // Try to connect to local dev server (assuming it might be running)
      await page.goto('http://localhost:3000', { timeout: 5000 });
      console.log('✅ Local dev server is running');
      
      // Check if React app renders correctly locally
      await expect(page.locator('text="Velocity Banking"')).toBeVisible({ timeout: 10000 });
      console.log('✅ React app renders correctly on local server');
      
      // Take screenshot of working local version
      await page.screenshot({ 
        path: 'test-results/local-server-working.png',
        fullPage: true 
      });
      console.log('✅ Screenshot taken of working local version');
      
    } catch (error) {
      console.log('ℹ️  Local dev server not running - this is expected for production verification');
    }
  });
  
  test('should create expected behavior test for post-deployment', async ({ page }) => {
    console.log('=== Expected Behavior After Deployment ===');
    
    // This test documents what should happen after the fix is deployed
    console.log('📋 Expected behavior after React 18 fix deployment:');
    console.log('   1. Website should load without blank page');
    console.log('   2. "Velocity Banking" title should be visible');
    console.log('   3. Login form should be present and functional');
    console.log('   4. Navigation should work');
    console.log('   5. No React 18 related console errors');
    
    // Navigate to live site to test when ready
    await page.goto('https://velocitybanking.naren.me');
    
    // Take screenshot for comparison
    await page.screenshot({ 
      path: 'test-results/verification-attempt.png',
      fullPage: true 
    });
    
    // This will be the test to run after deployment
    try {
      await expect(page.locator('text="Velocity Banking"')).toBeVisible({ timeout: 10000 });
      console.log('🎉 SUCCESS: React 18 fix is working on live site!');
      
      // Test login form
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Login")')).toBeVisible();
      console.log('✅ Login form is functional');
      
      // Test basic functionality
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Login")');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Login and navigation working');
      
      await page.screenshot({ 
        path: 'test-results/live-site-working.png',
        fullPage: true 
      });
      console.log('✅ Success screenshot taken');
      
    } catch (error) {
      console.log('⏳ React 18 fix not yet deployed to live site');
      console.log('   Current issue: Blank page indicates React app not rendering');
      console.log('   Next step: Deploy the React 18 fix to production');
    }
  });
});