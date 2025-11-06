import { test, expect } from '@playwright/test';

test('Check React rendering and JavaScript execution', async ({ page }) => {
  console.log('🔍 Testing React rendering...');
  
  // Capture all console messages and errors
  const consoleMessages: Array<{type: string, text: string}> = [];
  const jsErrors: string[] = [];
  
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
    
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });
  
  // Capture JavaScript errors
  page.on('pageerror', (error) => {
    jsErrors.push(`Page Error: ${error.message}`);
    console.log('❌ JavaScript Error:', error.message);
  });
  
  // Navigate to the website
  await page.goto('https://velocitybanking.naren.me');
  
  // Wait for basic loading
  await page.waitForLoadState('domcontentloaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/react-test-initial.png', fullPage: true });
  
  // Wait for React scripts to load
  await page.waitForFunction(
    () => window.React && window.ReactDOM,
    { timeout: 10000 }
  ).catch(() => console.log('❌ React/ReactDOM not available globally'));
  
  // Wait longer for application to render
  await page.waitForTimeout(5000);
  
  // Check if the root element has any React-rendered content
  const rootElement = page.locator('#root');
  const rootContent = await rootElement.innerHTML().catch(() => '');
  console.log('🏗️ Root element content length:', rootContent.length);
  console.log('🏗️ Root element preview:', rootContent.substring(0, 200));
  
  // Wait for any React component to render
  const hasReactContent = await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout: 10000 }
  ).then(() => true).catch(() => false);
  
  console.log('⚛️ React content rendered:', hasReactContent);
  
  // Try to find any rendered content
  const allElements = await page.locator('*').count();
  console.log('📊 Total DOM elements:', allElements);
  
  // Check for specific text content that should be rendered
  const pageTextContent = await page.textContent('body');
  const hasAppContent = pageTextContent && !pageTextContent.includes('import {');
  console.log('📝 Has app content (not raw JS):', hasAppContent);
  
  // Check if React Router is working
  const currentURL = page.url();
  console.log('🔗 Current URL:', currentURL);
  
  // Take screenshot after waiting
  await page.screenshot({ path: 'test-results/react-test-after-wait.png', fullPage: true });
  
  // Force a hard refresh to bypass any cache
  console.log('🔄 Performing hard refresh...');
  await page.goto('https://velocitybanking.naren.me', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Take screenshot after refresh
  await page.screenshot({ path: 'test-results/react-test-after-refresh.png', fullPage: true });
  
  // Final checks
  const finalRootContent = await page.locator('#root').innerHTML().catch(() => '');
  console.log('🔍 Final root content preview:', finalRootContent.substring(0, 300));
  
  // Report all console messages
  console.log('\n📋 All Console Messages:');
  consoleMessages.forEach((msg, index) => {
    console.log(`  ${index + 1}. [${msg.type}] ${msg.text}`);
  });
  
  // Report JavaScript errors
  if (jsErrors.length > 0) {
    console.log('\n❌ JavaScript Errors Found:');
    jsErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ No JavaScript errors found');
  }
  
  // Check if the page shows the Cloudflare challenge
  const bodyText = await page.textContent('body');
  const isCloudflareChallenge = bodyText?.includes('cloudflare') && bodyText?.includes('challenge');
  console.log('☁️ Cloudflare challenge detected:', isCloudflareChallenge);
  
  // Wait for any Cloudflare challenge to complete
  if (isCloudflareChallenge) {
    console.log('⏳ Waiting for Cloudflare challenge to complete...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'test-results/react-test-post-cloudflare.png', fullPage: true });
  }
});