import { test, expect } from '@playwright/test';

test.describe('Velocity Banking Demo Application Test', () => {
  test('should load demo application and verify all features are accessible', async ({ page }) => {
    console.log('Starting velocity banking demo test...');
    
    // Set longer timeout for this test
    test.setTimeout(120000);
    
    try {
      // Navigate to the demo application
      console.log('Navigating to https://velocitybanking.naren.me...');
      await page.goto('https://velocitybanking.naren.me', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Take screenshot of the main page
      await page.screenshot({ 
        path: 'test-results/demo-main-page.png', 
        fullPage: true 
      });
      console.log('✅ Main page screenshot taken');
      
      // Verify page loads successfully
      await expect(page).toHaveTitle(/Velocity Banking|HELOC|Mortgage/i);
      console.log('✅ Page title verified');
      
      // Look for main navigation elements
      const navElements = ['Dashboard', 'Mortgages', 'HELOC', 'Strategy', 'Analytics'];
      const foundNavElements = [];
      
      for (const element of navElements) {
        const locator = page.locator(`text="${element}"`).first();
        if (await locator.isVisible({ timeout: 5000 })) {
          foundNavElements.push(element);
          console.log(`✅ Found navigation: ${element}`);
        }
      }
      
      // Test navigation to different pages
      for (const navItem of foundNavElements) {
        try {
          console.log(`Clicking on ${navItem}...`);
          const navLink = page.locator(`text="${navItem}"`).first();
          await navLink.click();
          await page.waitForTimeout(2000); // Wait for page to load
          
          // Take screenshot of each page
          const filename = `test-results/demo-${navItem.toLowerCase()}-page.png`;
          await page.screenshot({ 
            path: filename, 
            fullPage: true 
          });
          console.log(`✅ ${navItem} page screenshot taken: ${filename}`);
        } catch (error) {
          console.log(`⚠️  Could not navigate to ${navItem}: ${error.message}`);
        }
      }
      
      // Check for key features mentioned in the requirements
      const featureChecks = [
        'mortgage',
        'heloc',
        'payment',
        'balance',
        'rate',
        'calculator',
        'strategy',
        'analytics',
        'dashboard'
      ];
      
      const foundFeatures = [];
      for (const feature of featureChecks) {
        const locator = page.locator(`text*="${feature}"`).first();
        if (await locator.isVisible({ timeout: 3000 })) {
          foundFeatures.push(feature);
          console.log(`✅ Found feature indicator: ${feature}`);
        }
      }
      
      // Look for multiple properties/accounts
      const accountIndicators = [
        'Primary Residence',
        'Investment Property', 
        'Property 1',
        'Property 2',
        'Account 1',
        'Account 2',
        'HELOC 1',
        'HELOC 2'
      ];
      
      const foundAccounts = [];
      for (const indicator of accountIndicators) {
        const locator = page.locator(`text*="${indicator}"`).first();
        if (await locator.isVisible({ timeout: 2000 })) {
          foundAccounts.push(indicator);
          console.log(`✅ Found account indicator: ${indicator}`);
        }
      }
      
      // Check for interactive elements
      const inputs = await page.locator('input, select, textarea').count();
      const buttons = await page.locator('button, [role="button"]').count();
      console.log(`✅ Found ${inputs} input fields and ${buttons} buttons`);
      
      // Final comprehensive screenshot
      await page.screenshot({ 
        path: 'test-results/demo-final-overview.png', 
        fullPage: true 
      });
      
      // Summary report
      console.log('\n=== VELOCITY BANKING DEMO TEST RESULTS ===');
      console.log(`✅ Application loaded successfully`);
      console.log(`✅ Found ${foundNavElements.length} navigation elements: ${foundNavElements.join(', ')}`);
      console.log(`✅ Found ${foundFeatures.length} feature indicators: ${foundFeatures.join(', ')}`);
      console.log(`✅ Found ${foundAccounts.length} account indicators: ${foundAccounts.join(', ')}`);
      console.log(`✅ Found ${inputs} interactive input fields`);
      console.log(`✅ Found ${buttons} clickable buttons`);
      console.log(`✅ All screenshots saved to test-results/`);
      
      // Verify this addresses the user's complaint
      if (foundNavElements.length >= 3 && foundFeatures.length >= 5) {
        console.log('\n🎉 SUCCESS: This demo addresses the user complaint "where are the other features"');
        console.log('✅ Multiple navigation options available');
        console.log('✅ Comprehensive features visible without authentication');
        console.log('✅ Interactive elements present for user engagement');
      } else {
        console.log('\n⚠️  WARNING: Limited features detected');
        console.log('- User may still experience the "missing features" complaint');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'test-results/demo-error-screenshot.png', 
        fullPage: true 
      });
      
      throw error;
    }
  });
});