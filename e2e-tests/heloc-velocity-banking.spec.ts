import { test, expect } from '@playwright/test';

test.describe('HELOC Velocity Banking E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test('Complete mortgage setup with income, expenses, and HELOC', async ({ page }) => {
    // Step 1: Navigate to Setup
    await page.click('text=Create Mortgage');
    await expect(page).toHaveURL(/.*setup/);
    await expect(page.getByRole('heading', { name: 'Velocity Banking Setup' })).toBeVisible();

    // Step 2: Fill in mortgage details
    await page.fill('input[name="principal"]', '1280000');
    await page.fill('input[name="interestRate"]', '4.88');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');

    // Step 3: Fill in income and expenses
    await page.fill('input[name="monthlyIncome"]', '18300');
    await page.fill('input[name="monthlyExpenses"]', '12900');

    // Step 4: Fill in HELOC details
    await page.fill('input[name="helocLimit"]', '50000');

    // Wait for conditional fields to appear
    await expect(page.locator('input[name="helocBalance"]')).toBeVisible();

    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');

    // Step 5: Verify calculated monthly payment is shown
    const paymentDisplay = page.locator('text=/Estimated Monthly Payment/').locator('..');
    await expect(paymentDisplay).toBeVisible();
    await expect(paymentDisplay.locator('text=/\\$6,7/')).toBeVisible();

    // Step 6: Submit the form
    await page.click('button:has-text("Create Mortgage")');

    // Step 7: Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: 'Velocity Banking Dashboard' })).toBeVisible();
  });

  test('Verify mortgage data is stored correctly', async ({ page, request }) => {
    // Create a mortgage first (simplified version)
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '1280000');
    await page.fill('input[name="interestRate"]', '4.88');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    await page.fill('input[name="monthlyIncome"]', '18300');
    await page.fill('input[name="monthlyExpenses"]', '12900');
    await page.fill('input[name="helocLimit"]', '50000');
    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');
    await page.click('button:has-text("Create Mortgage")');

    // Wait for redirect
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify via API that data was stored correctly
    const response = await request.get('http://localhost:3001/api/mortgages/demo-user');
    expect(response.ok()).toBeTruthy();

    const mortgages = await response.json();
    expect(Array.isArray(mortgages)).toBeTruthy();
    expect(mortgages.length).toBeGreaterThan(0);

    const mortgage = mortgages[0];
    expect(mortgage.monthlyIncome).toBe(18300);
    expect(mortgage.monthlyExpenses).toBe(12900);
  });

  test('HELOC Strategy page displays financial profile correctly', async ({ page }) => {
    // First create a mortgage with full details
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '1280000');
    await page.fill('input[name="interestRate"]', '4.88');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    await page.fill('input[name="monthlyIncome"]', '18300');
    await page.fill('input[name="monthlyExpenses"]', '12900');
    await page.fill('input[name="helocLimit"]', '50000');
    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');
    await page.click('button:has-text("Create Mortgage")');

    // Navigate to HELOC Strategy page
    await page.click('text=HELOC Strategy');
    await expect(page).toHaveURL(/.*heloc-strategy/);

    // Verify financial profile card is displayed
    await expect(page.getByRole('heading', { name: 'Your Financial Profile' })).toBeVisible();
    await expect(page.locator('text=/\\$18,300/')).toBeVisible(); // Monthly Income
    await expect(page.locator('text=/\\$12,900/')).toBeVisible(); // Monthly Expenses

    // Verify HELOC details card
    await expect(page.getByRole('heading', { name: 'HELOC Details' })).toBeVisible();
    await expect(page.locator('text=/\\$50,000/').first()).toBeVisible(); // Credit Limit

    // Verify chunk amount slider is present
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test('Calculate HELOC velocity banking strategy', async ({ page }) => {
    // Setup mortgage with full details
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '500000');
    await page.fill('input[name="interestRate"]', '5.0');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    await page.fill('input[name="monthlyIncome"]', '10000');
    await page.fill('input[name="monthlyExpenses"]', '5000');
    await page.fill('input[name="helocLimit"]', '50000');
    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');
    await page.click('button:has-text("Create Mortgage")');

    // Go to HELOC Strategy
    await page.click('text=HELOC Strategy');

    // Adjust chunk amount using slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('10000');

    // Click Calculate Strategy
    await page.click('button:has-text("Calculate Strategy")');

    // Wait for calculation to complete
    await expect(page.getByRole('heading', { name: 'Strategy Summary' })).toBeVisible({ timeout: 10000 });

    // Verify summary cards are displayed
    await expect(page.locator('text=/Total Cycles/')).toBeVisible();
    await expect(page.locator('text=/Payoff Time/')).toBeVisible();
    await expect(page.locator('text=/Total Interest/')).toBeVisible();
    await expect(page.locator('text=/Net Savings/')).toBeVisible();

    // Verify month-by-month table is displayed
    await expect(page.getByRole('heading', { name: 'Month-by-Month Breakdown' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Verify table has headers
    await expect(page.locator('th:has-text("Month")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
    await expect(page.locator('th:has-text("HELOC Pull")')).toBeVisible();
    await expect(page.locator('th:has-text("Mortgage Balance")')).toBeVisible();

    // Verify at least one row with PULL action exists
    await expect(page.locator('span:has-text("PULL")')).toBeVisible();
  });

  test('Verify HELOC data is created and fetched correctly', async ({ page, request }) => {
    // Create mortgage with HELOC
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '1280000');
    await page.fill('input[name="interestRate"]', '4.88');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    await page.fill('input[name="monthlyIncome"]', '18300');
    await page.fill('input[name="monthlyExpenses"]', '12900');
    await page.fill('input[name="helocLimit"]', '50000');
    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');
    await page.click('button:has-text("Create Mortgage")');

    await expect(page).toHaveURL(/.*dashboard/);

    // Get mortgage ID by fetching mortgages
    const mortgagesResponse = await request.get('http://localhost:3001/api/mortgages/demo-user');
    const mortgages = await mortgagesResponse.json();
    const mortgageId = mortgages[0].id;

    // Fetch HELOC via API
    const helocResponse = await request.get(`http://localhost:3001/api/helocs/mortgage/${mortgageId}`);
    expect(helocResponse.ok()).toBeTruthy();

    const heloc = await helocResponse.json();
    expect(heloc.creditLimit).toBe(50000);
    expect(heloc.currentBalance).toBe(0);
    expect(heloc.interestRate).toBe(7.5);
  });

  test('Error handling when missing income/expenses', async ({ page }) => {
    // Create mortgage WITHOUT income/expenses
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '500000');
    await page.fill('input[name="interestRate"]', '5.0');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    // Skip income/expenses
    await page.fill('input[name="helocLimit"]', '50000');
    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');
    await page.click('button:has-text("Create Mortgage")');

    // Navigate to HELOC Strategy
    await page.click('text=HELOC Strategy');

    // Should show error message
    await expect(page.getByRole('heading', { name: 'Missing Financial Information' })).toBeVisible();
    await expect(page.locator('text=/Monthly income and expenses are required/')).toBeVisible();
  });

  test('Error handling when missing HELOC', async ({ page }) => {
    // Create mortgage WITHOUT HELOC
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '500000');
    await page.fill('input[name="interestRate"]', '5.0');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    await page.fill('input[name="monthlyIncome"]', '10000');
    await page.fill('input[name="monthlyExpenses"]', '5000');
    // Skip HELOC
    await page.click('button:has-text("Create Mortgage")');

    // Navigate to HELOC Strategy
    await page.click('text=HELOC Strategy');

    // Should show error message
    await expect(page.getByRole('heading', { name: 'No HELOC Found' })).toBeVisible();
    await expect(page.locator('text=/Please add HELOC details/')).toBeVisible();
  });

  test('Validate HELOC calculation with insufficient cashflow', async ({ page }) => {
    // Create mortgage with expenses > income (invalid)
    await page.goto('http://localhost:3000/setup');
    await page.fill('input[name="principal"]', '500000');
    await page.fill('input[name="interestRate"]', '5.0');
    await page.selectOption('select[name="termYears"]', '30');
    await page.fill('input[name="startDate"]', '2023-10-01');
    await page.fill('input[name="monthlyIncome"]', '3000'); // Low income
    await page.fill('input[name="monthlyExpenses"]', '5000'); // High expenses
    await page.fill('input[name="helocLimit"]', '50000');
    await page.fill('input[name="helocBalance"]', '0');
    await page.fill('input[name="helocRate"]', '7.5');
    await page.click('button:has-text("Create Mortgage")');

    // Go to HELOC Strategy
    await page.click('text=HELOC Strategy');

    // Try to calculate - should show error
    await page.click('button:has-text("Calculate Strategy")');

    // Should display error message
    await expect(page.locator('text=/Monthly income must exceed expenses/')).toBeVisible({ timeout: 5000 });
  });
});
