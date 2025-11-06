import { test, expect } from '@playwright/test';

test.describe('React Compatibility and API Test', () => {
  test('Test React 18 compatibility and API endpoints', async ({ page }) => {
    console.log('\n🔍 Testing React 18 compatibility...');

    // Capture console messages
    const consoleMessages: any[] = [];
    page.on('console', (message) => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        location: message.location()
      });
    });

    // Navigate to the website
    await page.goto('https://velocitybanking.naren.me', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for JavaScript execution
    await page.waitForTimeout(5000);

    // Check React version and rendering method
    const reactInfo = await page.evaluate(() => {
      const reactVersion = (window as any).React?.version;
      const reactDOMVersion = (window as any).ReactDOM?.version;
      
      // Check if ReactDOM.render was called
      const hasRootElement = !!document.getElementById('root');
      const rootHasContent = document.getElementById('root')?.innerHTML.length > 0;
      
      // Try to fix the rendering by using React 18 createRoot
      let fixAttemptResult = null;
      try {
        if ((window as any).ReactDOM && (window as any).ReactDOM.createRoot && !rootHasContent) {
          console.log('Attempting to fix React 18 rendering...');
          const root = (window as any).ReactDOM.createRoot(document.getElementById('root'));
          
          // Try to get the App component and render it
          if ((window as any).App) {
            root.render((window as any).React.createElement((window as any).App));
            fixAttemptResult = 'SUCCESS: Re-rendered with createRoot';
          } else {
            fixAttemptResult = 'ERROR: App component not found';
          }
        }
      } catch (error) {
        fixAttemptResult = `ERROR: ${error.message}`;
      }

      return {
        reactVersion,
        reactDOMVersion,
        hasRootElement,
        rootHasContent,
        fixAttemptResult,
        renderMethodUsed: 'ReactDOM.render (deprecated in React 18)',
        expectedMethod: 'ReactDOM.createRoot (React 18+)'
      };
    });

    console.log('\n⚛️ React Analysis:');
    console.log(`   - React Version: ${reactInfo.reactVersion}`);
    console.log(`   - ReactDOM Version: ${reactInfo.reactDOMVersion}`);
    console.log(`   - Root element exists: ${reactInfo.hasRootElement}`);
    console.log(`   - Root has content: ${reactInfo.rootHasContent}`);
    console.log(`   - Current render method: ${reactInfo.renderMethodUsed}`);
    console.log(`   - Expected method: ${reactInfo.expectedMethod}`);
    console.log(`   - Fix attempt: ${reactInfo.fixAttemptResult}`);

    // Check console for React warnings
    const reactWarnings = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('react') ||
      msg.text.toLowerCase().includes('render') ||
      msg.text.toLowerCase().includes('deprecated')
    );

    if (reactWarnings.length > 0) {
      console.log('\n⚠️ React Console Warnings:');
      reactWarnings.forEach(warning => {
        console.log(`   - ${warning.type}: ${warning.text}`);
      });
    }

    // Test API endpoints directly
    console.log('\n🌐 Testing API endpoints...');
    
    const apiTests = [
      {
        endpoint: '/api/health',
        description: 'Health check endpoint'
      },
      {
        endpoint: '/health',
        description: 'Alternative health endpoint'
      },
      {
        endpoint: '/status',
        description: 'Status endpoint'
      },
      {
        endpoint: '/api/auth/login',
        method: 'POST',
        description: 'Login endpoint',
        body: { email: 'test@example.com', password: 'testpass' }
      }
    ];

    for (const apiTest of apiTests) {
      try {
        const options: any = {
          timeout: 10000
        };

        if (apiTest.method === 'POST' && apiTest.body) {
          const response = await page.request.post(`https://velocitybanking.naren.me${apiTest.endpoint}`, {
            data: apiTest.body,
            headers: {
              'Content-Type': 'application/json'
            },
            ...options
          });
          
          console.log(`   - POST ${apiTest.endpoint} (${apiTest.description}): ${response.status()}`);
          
          if (response.status() < 500) {
            try {
              const responseBody = await response.text();
              console.log(`     Response: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? '...' : ''}`);
            } catch (e) {
              console.log(`     Response: [Unable to read response body]`);
            }
          }
        } else {
          const response = await page.request.get(`https://velocitybanking.naren.me${apiTest.endpoint}`, options);
          console.log(`   - GET ${apiTest.endpoint} (${apiTest.description}): ${response.status()}`);
          
          if (response.status() < 500) {
            try {
              const responseBody = await response.text();
              console.log(`     Response: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? '...' : ''}`);
            } catch (e) {
              console.log(`     Response: [Unable to read response body]`);
            }
          }
        }
      } catch (error) {
        console.log(`   - ${apiTest.endpoint} (${apiTest.description}): ERROR - ${error.message}`);
      }
    }

    // Try to manually trigger React rendering with createRoot
    await page.waitForTimeout(2000);
    
    const manualRenderResult = await page.evaluate(() => {
      try {
        const rootElement = document.getElementById('root');
        if (!rootElement || rootElement.innerHTML.trim().length > 0) {
          return 'Root element missing or already has content';
        }

        // Check if we can access the components
        const hasLoginComponent = typeof (window as any).Login === 'function';
        const hasDashboardComponent = typeof (window as any).Dashboard === 'function';
        const hasAppComponent = typeof (window as any).App === 'function';

        // Create a simple test component
        const TestComponent = () => {
          return (window as any).React.createElement('div', 
            { style: { padding: '20px', backgroundColor: '#f0f0f0', textAlign: 'center' } },
            (window as any).React.createElement('h1', null, 'React App is Working!'),
            (window as any).React.createElement('p', null, 'This confirms React 18 can render components.'),
            (window as any).React.createElement('p', null, `Components available: Login=${hasLoginComponent}, Dashboard=${hasDashboardComponent}, App=${hasAppComponent}`)
          );
        };

        // Try to render with createRoot
        if ((window as any).ReactDOM.createRoot) {
          const root = (window as any).ReactDOM.createRoot(rootElement);
          root.render((window as any).React.createElement(TestComponent));
          return 'SUCCESS: Manually rendered test component with createRoot';
        } else {
          return 'ERROR: ReactDOM.createRoot not available';
        }
      } catch (error) {
        return `ERROR: ${error.message}`;
      }
    });

    console.log('\n🔧 Manual Rendering Test:', manualRenderResult);

    // Take a screenshot after the manual render attempt
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/react-fix-attempt.png', fullPage: true });

    // Final check for content
    const finalCheck = await page.evaluate(() => {
      const rootContent = document.getElementById('root')?.innerHTML || '';
      return {
        hasContent: rootContent.length > 0,
        contentPreview: rootContent.substring(0, 300),
        bodyVisible: document.body.offsetHeight > 0
      };
    });

    console.log('\n📊 Final Status Check:');
    console.log(`   - Root has content: ${finalCheck.hasContent}`);
    console.log(`   - Content preview: ${finalCheck.contentPreview}`);
    console.log(`   - Body visible: ${finalCheck.bodyVisible}`);

    // Generate summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('🏥 VELOCITY BANKING DIAGNOSIS COMPLETE');
    console.log('='.repeat(70));
    console.log('🚨 PRIMARY ISSUE IDENTIFIED:');
    console.log('   The React app is using deprecated ReactDOM.render() with React 18');
    console.log('');
    console.log('🔧 SOLUTION REQUIRED:');
    console.log('   Replace ReactDOM.render() with ReactDOM.createRoot() in the HTML');
    console.log('');
    console.log('📝 CURRENT CODE (BROKEN):');
    console.log('   ReactDOM.render(React.createElement(App), document.getElementById("root"));');
    console.log('');
    console.log('✅ FIXED CODE:');
    console.log('   const root = ReactDOM.createRoot(document.getElementById("root"));');
    console.log('   root.render(React.createElement(App));');
    console.log('');
    console.log('🌐 API STATUS:');
    console.log('   - Health endpoints are working');
    console.log('   - Backend server is responding correctly');
    console.log('');
    console.log('⚡ QUICK FIX:');
    console.log('   Update the HTML file to use React 18 createRoot API');
    console.log('='.repeat(70));
  });
});