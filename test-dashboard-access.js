const { chromium } = require('playwright');

async function testDashboardAccess() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:3000';
  
  console.log('🚀 Testing Dashboard Access...\n');
  
  try {
    // Load the application
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to create an account first
    console.log('📝 Attempting to create account...');
    const createAccountBtn = page.locator('button:has-text("Create Account")');
    if (await createAccountBtn.isVisible()) {
      await createAccountBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/signup-page.png', fullPage: true });
      
      // Fill signup form if visible
      const signupEmail = page.locator('input[type="email"]').first();
      const signupPassword = page.locator('input[type="password"]').first();
      const signupBtn = page.locator('button:has-text("Sign Up"), button:has-text("Create")').first();
      
      if (await signupEmail.isVisible()) {
        await signupEmail.fill('test@example.com');
        await signupPassword.fill('password123');
        await signupBtn.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Try to go directly to dashboard
    console.log('🏠 Attempting to access dashboard...');
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/dashboard-attempt.png', fullPage: true });
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login') || currentUrl === baseUrl + '/') {
      console.log('🔐 Redirected to login, attempting login...');
      
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const loginBtn = page.locator('button:has-text("Sign In")').first();
      
      // Try different credentials
      const credentials = [
        { email: 'test@example.com', password: 'password123' },
        { email: 'admin@example.com', password: 'admin123' },
        { email: 'user@test.com', password: 'test123' },
        { email: 'demo@demo.com', password: 'demo123' }
      ];
      
      for (const cred of credentials) {
        console.log(`Trying credentials: ${cred.email}`);
        
        await emailInput.fill(cred.email);
        await passwordInput.fill(cred.password);
        await loginBtn.click();
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log('URL after login attempt:', newUrl);
        
        if (newUrl.includes('/dashboard') || newUrl.includes('/setup')) {
          console.log('✅ Login successful!');
          await page.screenshot({ path: 'test-results/successful-login.png', fullPage: true });
          break;
        } else {
          console.log('❌ Login failed, trying next credentials...');
          await page.screenshot({ path: `test-results/failed-login-${cred.email.replace('@', '-')}.png`, fullPage: true });
        }
      }
    }
    
    // Try to navigate to different pages
    const pages = ['/dashboard', '/calculator', '/heloc-strategy', '/target-year-strategy', '/investment-comparison'];
    
    for (const pagePath of pages) {
      console.log(`🧭 Testing page: ${pagePath}`);
      await page.goto(`${baseUrl}${pagePath}`);
      await page.waitForTimeout(2000);
      
      const pageTitle = await page.title();
      const url = page.url();
      console.log(`Page: ${pagePath} -> URL: ${url}, Title: ${pageTitle}`);
      
      await page.screenshot({ 
        path: `test-results/page-${pagePath.replace('/', '')}.png`, 
        fullPage: true 
      });
      
      // Check for navigation elements
      const navLinks = await page.locator('nav a').allTextContents();
      console.log(`Navigation links on ${pagePath}:`, navLinks);
      
      // Check for main content
      const hasContent = await page.locator('main, .main-content, [role="main"]').count() > 0;
      console.log(`Has main content: ${hasContent}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  await browser.close();
}

testDashboardAccess().catch(console.error);