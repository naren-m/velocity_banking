# E2E Testing for Velocity Banking

## Overview
This directory contains comprehensive end-to-end tests for the HELOC Velocity Banking application using Playwright.

## Test Coverage

### 1. **Complete Mortgage Setup Flow**
- Tests the entire mortgage creation process including:
  - Basic mortgage details (principal, rate, term, start date)
  - Financial information (monthly income and expenses)
  - HELOC details (credit limit, balance, interest rate)
  - Form validation and calculated payment display
  - Successful submission and redirect to dashboard

### 2. **Data Persistence Tests**
- Verifies mortgage data is correctly stored in the database
- Validates that `monthlyIncome` and `monthlyExpenses` are persisted
- Tests HELOC creation and retrieval via API

### 3. **HELOC Strategy Page Tests**
- Validates financial profile display
- Tests HELOC details rendering
- Verifies chunk amount slider functionality
- Tests complete strategy calculation
- Validates month-by-month breakdown table

### 4. **Error Handling Tests**
- Missing income/expenses validation
- Missing HELOC validation
- Insufficient cashflow scenarios

### 5. **HELOC Velocity Banking Calculation**
- Tests the complete calculation flow
- Verifies strategy summary (cycles, payoff time, total interest, net savings)
- Validates detailed month-by-month table with:
  - Month numbers
  - Action types (PULL, PAYDOWN, COMPLETE)
  - HELOC pull amounts
  - Mortgage balance tracking
  - HELOC interest calculations

## Setup

### Install Dependencies
```bash
npm install
npx playwright install chromium
```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Tests
```bash
npm run test:e2e:debug
```

### View Test Report
```bash
npm run test:report
```

## Prerequisites

### Ensure Docker Containers are Running
```bash
docker-compose up -d
```

The tests are configured to automatically start the application if it's not running, but for best results, have the containers running first.

### Clear Database Before Tests (Optional)
If you want a clean slate:
```bash
docker exec velocity-banking-backend node -e "
const Database = require('better-sqlite3');
const db = new Database('/app/data/velocity-banking.db');
db.exec('DELETE FROM helocs');
db.exec('DELETE FROM mortgages');
console.log('Database cleared');
"
```

## Test Structure

Each test follows this pattern:
1. **Setup** - Navigate to the application and perform necessary setup
2. **Action** - Execute the user action being tested
3. **Assertion** - Verify the expected outcome

## Key Test Files

- `e2e-tests/heloc-velocity-banking.spec.ts` - Main test suite
- `playwright.config.ts` - Playwright configuration

## Troubleshooting

### Tests Failing Due to Timing Issues
- Increase timeout in `playwright.config.ts`
- Add explicit waits in tests using `await expect(...).toBeVisible({ timeout: 10000 })`

### Database State Issues
- Tests run sequentially to avoid race conditions
- Clear database between test runs if needed

### Port Conflicts
- Ensure ports 3000 (frontend) and 3001 (backend) are available
- Stop other instances of the application

## Best Practices

1. **Run tests sequentially** - The configuration uses `workers: 1` to avoid database conflicts
2. **Clear database between major test runs** - Prevents data pollution
3. **Use explicit waits** - Better than arbitrary `setTimeout()` calls
4. **Test both happy path and error cases** - Comprehensive coverage
5. **Verify via API when possible** - More reliable than UI-only checks

## Adding New Tests

When adding new tests:
1. Follow the existing pattern in `heloc-velocity-banking.spec.ts`
2. Add descriptive test names
3. Include both positive and negative test cases
4. Verify data persistence when applicable
5. Clean up test data if needed
