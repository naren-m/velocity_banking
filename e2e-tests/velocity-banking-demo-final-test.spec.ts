import { test, expect } from '@playwright/test';

test.describe('Velocity Banking Demo - Complete Feature Verification', () => {
  test('verify comprehensive demo addresses user complaints about missing features', async ({ page }) => {
    console.log('🚀 Starting comprehensive Velocity Banking demo verification...');
    
    test.setTimeout(120000);
    
    try {
      // Navigate to the demo application
      console.log('📱 Loading demo application...');
      await page.goto('https://velocitybanking.naren.me', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Verify immediate access (no authentication required)
      console.log('🔓 Verifying immediate access without authentication...');
      await expect(page).toHaveTitle(/Velocity Banking|HELOC|Mortgage/i);
      
      // Check for authentication barriers
      const authElements = page.locator('input[type="password"], [placeholder*="password"], text="Sign In", text="Log In", text="Login"');
      const authCount = await authElements.count();
      console.log(`✅ Authentication barriers found: ${authCount} (should be 0)`);
      
      // Verify full navigation is present
      console.log('🧭 Checking navigation menu...');
      const expectedNavItems = ['Dashboard', 'Mortgages', 'HELOC', 'Strategy', 'Analytics'];
      const foundNavItems = [];
      
      for (const navItem of expectedNavItems) {
        const navElement = page.locator(`text="${navItem}"`).first();
        if (await navElement.isVisible()) {
          foundNavItems.push(navItem);
          console.log(`✅ Found navigation: ${navItem}`);
        }
      }
      
      // Take screenshot of main dashboard
      await page.screenshot({ 
        path: 'test-results/final-dashboard-overview.png', 
        fullPage: true 
      });
      
      // Verify Dashboard features
      console.log('📊 Verifying comprehensive dashboard...');
      const dashboardFeatures = [];
      
      // Check for financial metrics
      const metrics = ['Net Worth', 'Mortgage Balance', 'Available Credit', 'Monthly Cashflow'];
      for (const metric of metrics) {
        const element = page.locator(`text="${metric}"`);
        if (await element.isVisible()) {
          dashboardFeatures.push(metric);
          console.log(`✅ Dashboard metric: ${metric}`);
        }
      }
      
      // Check for multiple mortgages indication
      const mortgageIndicator = page.locator('text="2 properties"');
      if (await mortgageIndicator.isVisible()) {
        dashboardFeatures.push('Multiple Properties');
        console.log('✅ Multiple properties confirmed');
      }
      
      // Check for HELOC accounts indication
      const helocIndicator = page.locator('text="2" >> text="HELOC Accounts"');
      if (await helocIndicator.isVisible()) {
        dashboardFeatures.push('Multiple HELOC Accounts');
        console.log('✅ Multiple HELOC accounts confirmed');
      }
      
      // Navigate to Mortgages page and verify multiple properties
      console.log('🏠 Testing Mortgages page...');
      await page.locator('text="Mortgages"').click();
      await page.waitForTimeout(2000);
      
      const primaryResidence = page.locator('text="Primary Residence"');
      const investmentProperty = page.locator('text="Investment Property"');
      
      const hasMultipleProperties = await primaryResidence.isVisible() && await investmentProperty.isVisible();
      console.log(`✅ Multiple properties visible: ${hasMultipleProperties}`);
      
      await page.screenshot({ 
        path: 'test-results/final-mortgages-multiple.png', 
        fullPage: true 
      });
      
      // Navigate to HELOC page and verify multiple accounts
      console.log('🏦 Testing HELOC page...');
      await page.locator('text="HELOC"').click();
      await page.waitForTimeout(2000);
      
      const chaseHeloc = page.locator('text="Chase Bank HELOC"');
      const wellsFargoHeloc = page.locator('text="Wells Fargo HELOC"');
      
      const hasMultipleHELOCs = await chaseHeloc.isVisible() && await wellsFargoHeloc.isVisible();
      console.log(`✅ Multiple HELOC accounts visible: ${hasMultipleHELOCs}`);
      
      await page.screenshot({ 
        path: 'test-results/final-heloc-multiple.png', 
        fullPage: true 
      });
      
      // Test Strategy calculator
      console.log('🧮 Testing interactive Strategy calculator...');
      await page.locator('text="Strategy"').click();
      await page.waitForTimeout(2000);
      
      // Look for interactive slider
      const slider = page.locator('input[type="range"], .slider, [role="slider"]');
      const hasInteractiveCalculator = await slider.count() > 0;
      console.log(`✅ Interactive calculator found: ${hasInteractiveCalculator}`);
      
      // Check for calculation results
      const calculationResults = [
        'Months to Pay Off Chunk',
        'Estimated Interest Saved',
        'Years Saved',
        'Recommended Steps'
      ];
      
      let calculatorFeatures = 0;
      for (const result of calculationResults) {
        const element = page.locator(`text="${result}"`);
        if (await element.isVisible()) {
          calculatorFeatures++;
          console.log(`✅ Calculator feature: ${result}`);
        }
      }
      
      await page.screenshot({ 
        path: 'test-results/final-strategy-calculator.png', 
        fullPage: true 
      });
      
      // Test Analytics page
      console.log('📈 Testing Analytics & Projections...');
      await page.locator('text="Analytics"').click();
      await page.waitForTimeout(2000);
      
      const analyticsFeatures = [
        'Debt Reduction Projections',
        'Interest Savings Analysis',
        'Traditional Payoff',
        'With Velocity Banking',
        'Portfolio Performance'
      ];
      
      let analyticsCount = 0;
      for (const feature of analyticsFeatures) {
        const element = page.locator(`text="${feature}"`);
        if (await element.isVisible()) {
          analyticsCount++;
          console.log(`✅ Analytics feature: ${feature}`);
        }
      }
      
      await page.screenshot({ 
        path: 'test-results/final-analytics-projections.png', 
        fullPage: true 
      });
      
      // Final comprehensive assessment
      console.log('\n=== COMPREHENSIVE DEMO VERIFICATION RESULTS ===');
      console.log(`✅ Application loads without authentication: ${authCount === 0}`);
      console.log(`✅ Full navigation available: ${foundNavItems.length}/${expectedNavItems.length} items`);
      console.log(`✅ Comprehensive dashboard: ${dashboardFeatures.length} key features`);
      console.log(`✅ Multiple mortgages visible: ${hasMultipleProperties}`);
      console.log(`✅ Multiple HELOC accounts visible: ${hasMultipleHELOCs}`);
      console.log(`✅ Interactive strategy calculator: ${hasInteractiveCalculator} (${calculatorFeatures} features)`);
      console.log(`✅ Analytics & projections: ${analyticsCount} features`);
      
      // Verify this addresses the original complaint
      const issuesAddressed = [];
      
      if (foundNavItems.length >= 4) {
        issuesAddressed.push('✅ Full navigation menu visible (not just dashboard)');
      }
      
      if (hasMultipleProperties) {
        issuesAddressed.push('✅ Multiple mortgages/properties shown (not just example)');
      }
      
      if (hasMultipleHELOCs) {
        issuesAddressed.push('✅ Multiple HELOC accounts available');
      }
      
      if (hasInteractiveCalculator && calculatorFeatures >= 3) {
        issuesAddressed.push('✅ Interactive strategy calculator working');
      }
      
      if (analyticsCount >= 4) {
        issuesAddressed.push('✅ Comprehensive analytics and projections');
      }
      
      if (authCount === 0) {
        issuesAddressed.push('✅ No authentication barriers - immediate access');
      }
      
      console.log('\n🎯 USER COMPLAINT RESOLUTION:');
      console.log('Original complaint: "where are the other features? i just see a example mortgage and that is it. only dashboard is visible."');
      console.log('\n📝 Issues Addressed:');
      issuesAddressed.forEach(issue => console.log(`   ${issue}`));
      
      if (issuesAddressed.length >= 5) {
        console.log('\n🎉 SUCCESS: Demo fully addresses user complaints!');
        console.log('✅ All velocity banking features are now accessible without authentication');
        console.log('✅ Multiple properties and accounts are visible');
        console.log('✅ Full navigation and comprehensive functionality available');
      } else {
        console.log('\n⚠️  PARTIAL: Some issues may remain');
      }
      
      // Assertions for test validation
      expect(authCount).toBe(0);
      expect(foundNavItems.length).toBeGreaterThanOrEqual(4);
      expect(hasMultipleProperties).toBeTruthy();
      expect(hasMultipleHELOCs).toBeTruthy();
      expect(hasInteractiveCalculator).toBeTruthy();
      expect(analyticsCount).toBeGreaterThanOrEqual(3);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      await page.screenshot({ 
        path: 'test-results/final-test-error.png', 
        fullPage: true 
      });
      throw error;
    }
  });
});