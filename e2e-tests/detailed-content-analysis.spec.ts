import { test, expect } from '@playwright/test';

test.describe('Detailed Content Analysis', () => {
  test('Analyze HTML content and JavaScript execution', async ({ page }) => {
    console.log('\n🔍 Starting detailed content analysis...');
    
    // Navigate to the website
    await page.goto('https://velocitybanking.naren.me', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for potential React rendering
    await page.waitForTimeout(5000);

    // Get the raw HTML content
    const htmlContent = await page.content();
    console.log('\n📄 HTML Content Length:', htmlContent.length);
    console.log('📄 HTML Preview (first 1000 chars):\n', htmlContent.substring(0, 1000));

    // Check the root element content
    const rootElement = await page.locator('#root');
    const rootExists = await rootElement.count() > 0;
    console.log('\n🏠 Root element exists:', rootExists);
    
    if (rootExists) {
      const rootContent = await rootElement.innerHTML();
      console.log('🏠 Root element content length:', rootContent.length);
      console.log('🏠 Root element content:', rootContent.substring(0, 500));
    }

    // Check for React/JavaScript execution
    const jsCheck = await page.evaluate(() => {
      return {
        windowReact: typeof (window as any).React !== 'undefined',
        windowReactDOM: typeof (window as any).ReactDOM !== 'undefined',
        hasReactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        documentReadyState: document.readyState,
        scriptsLoaded: Array.from(document.querySelectorAll('script')).map(script => ({
          src: script.src,
          hasContent: script.innerHTML.length > 0
        })),
        bodyContent: document.body?.innerHTML?.length || 0,
        allElements: document.querySelectorAll('*').length,
        console: (window as any).console !== undefined
      };
    });

    console.log('\n⚛️ JavaScript Environment Check:');
    console.log('   - React available:', jsCheck.windowReact);
    console.log('   - ReactDOM available:', jsCheck.windowReactDOM);
    console.log('   - React DevTools:', jsCheck.hasReactDevTools);
    console.log('   - Document ready:', jsCheck.documentReadyState);
    console.log('   - Body content length:', jsCheck.bodyContent);
    console.log('   - Total DOM elements:', jsCheck.allElements);
    console.log('   - Scripts loaded:', jsCheck.scriptsLoaded.length);

    // Try to execute some JavaScript to see what happens
    try {
      const reactTest = await page.evaluate(() => {
        // Try to create a simple React element
        if ((window as any).React && (window as any).ReactDOM) {
          const element = (window as any).React.createElement('div', null, 'Test');
          return {
            success: true,
            element: element !== null,
            reactVersion: (window as any).React?.version || 'unknown'
          };
        }
        return { success: false, error: 'React not available' };
      });
      
      console.log('\n🧪 React Test Result:', reactTest);
    } catch (error) {
      console.log('\n❌ React Test Error:', error);
    }

    // Check for any error messages in the DOM
    const errorMessages = await page.evaluate(() => {
      const possibleErrorSelectors = [
        '[class*="error"]',
        '[class*="Error"]',
        '[id*="error"]',
        '[data-testid*="error"]',
        '.error-message',
        '.error-container'
      ];
      
      const errors = [];
      for (const selector of possibleErrorSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.textContent?.trim()) {
            errors.push({
              selector,
              content: el.textContent.trim(),
              visible: (el as HTMLElement).offsetParent !== null
            });
          }
        });
      }
      
      return errors;
    });

    if (errorMessages.length > 0) {
      console.log('\n⚠️ Potential Error Messages Found:');
      errorMessages.forEach(error => {
        console.log(`   - ${error.selector}: ${error.content} (visible: ${error.visible})`);
      });
    }

    // Check if there's any content in common UI containers
    const commonContainers = await page.evaluate(() => {
      const selectors = ['#app', '#root', 'main', '.app', '.container', '[role="main"]'];
      const results = [];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          results.push({
            selector,
            hasContent: element.innerHTML.trim().length > 0,
            contentLength: element.innerHTML.length,
            childrenCount: element.children.length
          });
        }
      }
      
      return results;
    });

    console.log('\n📦 Common Container Check:');
    commonContainers.forEach(container => {
      console.log(`   - ${container.selector}: content=${container.hasContent}, length=${container.contentLength}, children=${container.childrenCount}`);
    });

    // Test direct API endpoint access
    try {
      console.log('\n🌐 Testing API endpoints...');
      
      // Try common API endpoints
      const apiEndpoints = [
        '/api/health',
        '/api/auth/login',
        '/api/users',
        '/health',
        '/status'
      ];

      for (const endpoint of apiEndpoints) {
        try {
          const response = await page.goto(`https://velocitybanking.naren.me${endpoint}`, { timeout: 5000 });
          console.log(`   - ${endpoint}: ${response?.status()}`);
        } catch (error) {
          console.log(`   - ${endpoint}: Failed to load`);
        }
      }
    } catch (error) {
      console.log('   API testing failed:', error);
    }

    // Final summary
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Page loads successfully: true`);
    console.log(`🎯 React detected: ${jsCheck.windowReact}`);
    console.log(`📄 HTML content length: ${htmlContent.length}`);
    console.log(`🏠 Root element exists: ${rootExists}`);
    console.log(`📱 DOM elements: ${jsCheck.allElements}`);
    console.log(`⚠️ Error messages: ${errorMessages.length}`);
    console.log('='.repeat(50));
  });
});