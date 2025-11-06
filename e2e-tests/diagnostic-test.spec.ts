import { test, expect } from '@playwright/test';

test('Diagnostic test for live website', async ({ page }) => {
  console.log('🔍 Starting diagnostic test...');
  
  // Navigate to the live website
  await page.goto('https://velocitybanking.naren.me');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot immediately
  await page.screenshot({ path: 'test-results/diagnostic-screenshot.png', fullPage: true });
  
  // Get page title
  const title = await page.title();
  console.log('📝 Page title:', title);
  
  // Get all text content
  const bodyText = await page.textContent('body');
  console.log('📄 Body text length:', bodyText?.length || 0);
  console.log('📄 First 500 characters:', bodyText?.substring(0, 500) || 'No text found');
  
  // Check HTML structure
  const htmlContent = await page.content();
  console.log('🏗️ HTML content length:', htmlContent.length);
  console.log('🏗️ Contains React:', htmlContent.includes('react'));
  console.log('🏗️ Contains root div:', htmlContent.includes('id="root"'));
  
  // Check for specific elements
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
  console.log('📋 All headings found:', headings);
  
  const inputs = await page.locator('input').count();
  console.log('📝 Number of input fields:', inputs);
  
  const buttons = await page.locator('button').count();
  console.log('🔘 Number of buttons:', buttons);
  
  // Check console errors
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  await page.waitForTimeout(3000);
  
  console.log('🖥️ Console messages:');
  consoleMessages.forEach(msg => console.log('  ', msg));
  
  // Check network responses
  const responses: string[] = [];
  page.on('response', (response) => {
    responses.push(`${response.status()}: ${response.url()}`);
  });
  
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  console.log('🌐 Network responses:');
  responses.slice(0, 10).forEach(resp => console.log('  ', resp));
  
  // Final screenshot
  await page.screenshot({ path: 'test-results/diagnostic-final.png', fullPage: true });
});