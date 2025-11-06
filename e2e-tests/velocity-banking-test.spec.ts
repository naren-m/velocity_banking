import { test, expect, Page } from '@playwright/test';

test.describe('Velocity Banking Application Tests', () => {
  let page: Page;
  const baseUrl = 'https://velocity-banking.codeturtle.app';

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test('Load application and take initial screenshot', async () => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial load
    await page.screenshot({ 
      path: 'test-results/01-initial-load.png', 
      fullPage: true 
    });
    
    // Check if page loads without major errors
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any error messages or 404s
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('Error');
  });

  test('Test login functionality', async () => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Look for login elements
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'test-results/02-login-page.png', 
      fullPage: true 
    });
    
    // Test invalid login
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@test.com');
      await passwordInput.fill('wrongpassword');
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/03-invalid-login.png', 
        fullPage: true 
      });
    }
    
    // Test valid login (if we know credentials)
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'test-results/04-after-login.png', 
        fullPage: true 
      });
    }
  });

  test('Navigate through all pages and verify features', async () => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to login first if needed
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Test Dashboard
    const dashboardLink = page.locator('a:has-text("Dashboard"), nav a[href*="dashboard"]').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'test-results/05-dashboard.png', 
        fullPage: true 
      });
      
      // Check for multiple mortgages
      const mortgageElements = page.locator('[data-testid*="mortgage"], .mortgage-card, .mortgage-item');
      const mortgageCount = await mortgageElements.count();
      console.log('Number of mortgage elements found:', mortgageCount);
    }
    
    // Test Mortgages page
    const mortgagesLink = page.locator('a:has-text("Mortgages"), nav a[href*="mortgage"]').first();
    if (await mortgagesLink.isVisible()) {
      await mortgagesLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'test-results/06-mortgages.png', 
        fullPage: true 
      });
    }
    
    // Test HELOC page
    const helocLink = page.locator('a:has-text("HELOC"), nav a[href*="heloc"]').first();
    if (await helocLink.isVisible()) {
      await helocLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'test-results/07-heloc.png', 
        fullPage: true 
      });
    }
    
    // Test Strategy page
    const strategyLink = page.locator('a:has-text("Strategy"), nav a[href*="strategy"]').first();
    if (await strategyLink.isVisible()) {
      await strategyLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'test-results/08-strategy.png', 
        fullPage: true 
      });
    }
    
    // Test Analytics page
    const analyticsLink = page.locator('a:has-text("Analytics"), nav a[href*="analytics"]').first();
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'test-results/09-analytics.png', 
        fullPage: true 
      });
    }
    
    // Check navigation menu structure
    const navLinks = page.locator('nav a, .nav-link, .navigation a');
    const navLinkCount = await navLinks.count();
    console.log('Number of navigation links found:', navLinkCount);
    
    if (navLinkCount > 0) {
      const navTexts = await navLinks.allTextContents();
      console.log('Navigation links:', navTexts);
    }
  });

  test('Test responsive design', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/10-mobile-view.png', 
      fullPage: true 
    });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/11-tablet-view.png', 
      fullPage: true 
    });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/12-desktop-view.png', 
      fullPage: true 
    });
  });

  test('Verify application features and content', async () => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Check for key application elements
    const pageContent = await page.textContent('body');
    
    // Look for velocity banking related content
    const hasVelocityContent = pageContent?.toLowerCase().includes('velocity') || 
                              pageContent?.toLowerCase().includes('banking') ||
                              pageContent?.toLowerCase().includes('mortgage');
    
    console.log('Has velocity banking content:', hasVelocityContent);
    
    // Check for financial data
    const hasFinancialData = pageContent?.includes('$') || 
                            pageContent?.includes('%') ||
                            pageContent?.toLowerCase().includes('balance') ||
                            pageContent?.toLowerCase().includes('payment');
    
    console.log('Has financial data:', hasFinancialData);
    
    // Check for interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('Number of buttons found:', buttonCount);
    
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log('Number of inputs found:', inputCount);
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'test-results/13-final-overview.png', 
      fullPage: true 
    });
  });
});