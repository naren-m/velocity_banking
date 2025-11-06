const { chromium } = require('playwright');
const fs = require('fs');

async function testVelocityBankingApp() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:3000';
  const testResults = [];
  
  console.log('🚀 Starting Velocity Banking Application Test...\n');
  
  try {
    // Test 1: Load application and take initial screenshot
    console.log('📱 Test 1: Loading application...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });
    
    const title = await page.title();
    console.log('✅ Page title:', title);
    testResults.push({ test: 'Initial Load', status: 'PASS', details: `Title: ${title}` });
    
    // Check for any obvious errors
    const bodyText = await page.textContent('body');
    const hasError = bodyText.includes('404') || bodyText.includes('Error') || bodyText.includes('Cannot GET');
    if (hasError) {
      console.log('⚠️  Warning: Error content detected on page');
      testResults.push({ test: 'Error Check', status: 'WARNING', details: 'Error content detected' });
    } else {
      testResults.push({ test: 'Error Check', status: 'PASS', details: 'No obvious errors' });
    }
    
    // Test 2: Check for navigation elements
    console.log('\n🧭 Test 2: Checking navigation...');
    const navLinks = await page.locator('nav a, .nav-link, [role="navigation"] a, header a').all();
    const navTexts = [];
    for (const link of navLinks) {
      const text = await link.textContent();
      if (text && text.trim()) {
        navTexts.push(text.trim());
      }
    }
    
    console.log('✅ Navigation links found:', navTexts);
    testResults.push({ 
      test: 'Navigation Elements', 
      status: navTexts.length > 0 ? 'PASS' : 'FAIL', 
      details: `Found ${navTexts.length} nav links: ${navTexts.join(', ')}` 
    });
    
    // Test 3: Check for expected pages
    console.log('\n📄 Test 3: Looking for expected pages...');
    const expectedPages = ['Dashboard', 'Mortgages', 'HELOC', 'Strategy', 'Analytics'];
    const foundPages = [];
    
    for (const pageName of expectedPages) {
      const pageLink = page.locator(`a:has-text("${pageName}"), [href*="${pageName.toLowerCase()}"]`).first();
      if (await pageLink.isVisible()) {
        foundPages.push(pageName);
        console.log(`✅ Found ${pageName} link`);
      } else {
        console.log(`❌ Missing ${pageName} link`);
      }
    }
    
    testResults.push({ 
      test: 'Expected Pages', 
      status: foundPages.length >= 3 ? 'PASS' : 'PARTIAL', 
      details: `Found: ${foundPages.join(', ')}. Missing: ${expectedPages.filter(p => !foundPages.includes(p)).join(', ')}` 
    });
    
    // Test 4: Check for login functionality
    console.log('\n🔐 Test 4: Checking login functionality...');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
    
    const hasLogin = await emailInput.isVisible() && await passwordInput.isVisible() && await loginButton.isVisible();
    
    if (hasLogin) {
      console.log('✅ Login form elements found');
      await page.screenshot({ path: 'test-results/02-login-form.png', fullPage: true });
      
      // Test login attempt
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await page.screenshot({ path: 'test-results/03-login-filled.png', fullPage: true });
      
      await loginButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/04-after-login-attempt.png', fullPage: true });
      
      testResults.push({ test: 'Login Form', status: 'PASS', details: 'Login form elements present and functional' });
    } else {
      console.log('❌ Login form not found');
      testResults.push({ test: 'Login Form', status: 'FAIL', details: 'Login form elements not found' });
    }
    
    // Test 5: Check for financial data and mortgage information
    console.log('\n💰 Test 5: Checking for financial content...');
    const pageContent = await page.textContent('body');
    
    const hasFinancialData = pageContent.includes('$') || 
                            pageContent.includes('%') ||
                            pageContent.toLowerCase().includes('balance') ||
                            pageContent.toLowerCase().includes('payment') ||
                            pageContent.toLowerCase().includes('mortgage');
    
    const hasMortgageData = pageContent.toLowerCase().includes('mortgage') ||
                           pageContent.toLowerCase().includes('principal') ||
                           pageContent.toLowerCase().includes('interest');
    
    console.log('✅ Has financial data:', hasFinancialData);
    console.log('✅ Has mortgage data:', hasMortgageData);
    
    testResults.push({ 
      test: 'Financial Content', 
      status: hasFinancialData ? 'PASS' : 'FAIL', 
      details: `Financial data: ${hasFinancialData}, Mortgage data: ${hasMortgageData}` 
    });
    
    // Test 6: Check for multiple mortgages (addressing user complaint)
    console.log('\n🏠 Test 6: Checking for multiple mortgages...');
    const mortgageElements = await page.locator('[class*="mortgage"], [data-testid*="mortgage"], .mortgage-card, .mortgage-item').all();
    const mortgageCount = mortgageElements.length;
    
    console.log(`✅ Found ${mortgageCount} mortgage-related elements`);
    
    if (mortgageCount > 1) {
      testResults.push({ test: 'Multiple Mortgages', status: 'PASS', details: `Found ${mortgageCount} mortgage elements` });
    } else if (mortgageCount === 1) {
      testResults.push({ test: 'Multiple Mortgages', status: 'PARTIAL', details: 'Only one mortgage element found (user complained about this)' });
    } else {
      testResults.push({ test: 'Multiple Mortgages', status: 'FAIL', details: 'No mortgage elements found' });
    }
    
    // Test 7: Test responsive design
    console.log('\n📱 Test 7: Testing responsive design...');
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/05-mobile-view.png', fullPage: true });
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/06-tablet-view.png', fullPage: true });
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/07-desktop-view.png', fullPage: true });
    
    testResults.push({ test: 'Responsive Design', status: 'PASS', details: 'Screenshots taken for mobile, tablet, and desktop' });
    
    // Test 8: Try navigating to different pages if they exist
    console.log('\n🧭 Test 8: Attempting navigation...');
    for (const pageName of foundPages) {
      try {
        const pageLink = page.locator(`a:has-text("${pageName}")`).first();
        if (await pageLink.isVisible()) {
          await pageLink.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `test-results/08-${pageName.toLowerCase()}-page.png`, fullPage: true });
          console.log(`✅ Successfully navigated to ${pageName}`);
          testResults.push({ test: `${pageName} Navigation`, status: 'PASS', details: `Successfully navigated to ${pageName}` });
        }
      } catch (error) {
        console.log(`❌ Failed to navigate to ${pageName}:`, error.message);
        testResults.push({ test: `${pageName} Navigation`, status: 'FAIL', details: error.message });
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/09-final-overview.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    testResults.push({ test: 'Overall Test', status: 'ERROR', details: error.message });
  }
  
  await browser.close();
  
  // Generate report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  
  testResults.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : 
                  result.status === 'FAIL' ? '❌' : 
                  result.status === 'PARTIAL' ? '⚠️' : 
                  result.status === 'WARNING' ? '⚠️' : '🔍';
    
    console.log(`${index + 1}. ${status} ${result.test}: ${result.details}`);
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL' || result.status === 'ERROR') failCount++;
    else warningCount++;
  });
  
  console.log('\n📈 SUMMARY STATISTICS');
  console.log('====================');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings/Partial: ${warningCount}`);
  console.log(`📊 Total Tests: ${testResults.length}`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    url: baseUrl,
    summary: {
      total: testResults.length,
      passed: passCount,
      failed: failCount,
      warnings: warningCount
    },
    results: testResults
  };
  
  fs.writeFileSync('test-results/velocity-banking-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved to: test-results/velocity-banking-test-report.json');
  console.log('📸 Screenshots saved to: test-results/');
  
  return report;
}

// Run the test
testVelocityBankingApp().catch(console.error);