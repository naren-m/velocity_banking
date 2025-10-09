import { HelocVelocityService } from '../services/helocVelocityService';

/**
 * Manual validation script to verify mathematical accuracy of HELOC calculations
 */

const service = new HelocVelocityService();

console.log('='.repeat(80));
console.log('HELOC VELOCITY BANKING - CALCULATION VALIDATION');
console.log('='.repeat(80));
console.log();

// Test Case 1: Verify interest calculation timing
console.log('TEST 1: Interest Calculation on Beginning Balance');
console.log('-'.repeat(80));

const test1Params = {
  mortgageBalance: 300000,
  mortgageRate: 6.0, // 6% annual = 0.5% monthly
  mortgagePayment: 1799, // Standard 30-year payment
  helocLimit: 50000,
  helocRate: 8.0,
  monthlyIncome: 8000,
  monthlyExpenses: 4000,
  chunkAmount: 10000,
};

const test1Result = service.calculateHelocStrategy(test1Params);

console.log(`Initial Balance: $${test1Params.mortgageBalance.toLocaleString()}`);
console.log(`Monthly Rate: ${(test1Params.mortgageRate / 12).toFixed(4)}%`);
console.log(`Expected Month 1 Interest: $${(test1Params.mortgageBalance * test1Params.mortgageRate / 12 / 100).toFixed(2)}`);
console.log();

console.log('First Cycle (Month 1 - Pull & Pay):');
const firstCycle = test1Result.cycles[0];
console.log(`  Action: ${firstCycle.action}`);
console.log(`  HELOC Pull: $${firstCycle.helocPull.toLocaleString()}`);
console.log(`  Total Payment: $${firstCycle.mortgagePayment.toLocaleString()}`);
console.log(`  Mortgage Balance After: $${firstCycle.mortgageBalance.toLocaleString()}`);
console.log(`  HELOC Balance: $${firstCycle.helocBalance.toLocaleString()}`);
console.log();

// Expected calculation:
// Interest on $300,000 @ 0.5%/month = $1,500
// Regular payment $1,799 - $1,500 interest = $299 principal
// Balance after regular: $300,000 - $299 = $299,701
// Then $10,000 chunk applied
// Final balance: $289,701

const expectedInterest = 1500;
const expectedPrincipal = 299;
const expectedBalance = 289701;

console.log('Expected Values:');
console.log(`  Interest: $${expectedInterest}`);
console.log(`  Principal from regular payment: $${expectedPrincipal}`);
console.log(`  Balance after both payments: $${expectedBalance.toLocaleString()}`);
console.log();

const balanceMatch = Math.abs(firstCycle.mortgageBalance - expectedBalance) < 100;
console.log(`✓ Balance Calculation: ${balanceMatch ? 'PASS' : 'FAIL'}`);
console.log();

// Test Case 2: Overall savings comparison
console.log('TEST 2: Savings Verification');
console.log('-'.repeat(80));

const monthlyRate = test1Params.mortgageRate / 12 / 100;
const standardMonths = Math.ceil(
  -Math.log(1 - (monthlyRate * test1Params.mortgageBalance) / test1Params.mortgagePayment) /
  Math.log(1 + monthlyRate)
);

console.log(`Standard Payoff Time: ${standardMonths} months (${(standardMonths/12).toFixed(1)} years)`);
console.log(`Velocity Payoff Time: ${test1Result.totalMonths} months (${(test1Result.totalMonths/12).toFixed(1)} years)`);
console.log(`Time Saved: ${standardMonths - test1Result.totalMonths} months (${((standardMonths - test1Result.totalMonths)/12).toFixed(1)} years)`);
console.log();

console.log(`Total Mortgage Interest: $${test1Result.totalMortgageInterest.toLocaleString()}`);
console.log(`Total HELOC Interest: $${test1Result.totalHelocInterest.toLocaleString()}`);
console.log(`Total Interest (Both): $${test1Result.totalInterest.toLocaleString()}`);
console.log(`Net Savings: $${test1Result.netSavings.toLocaleString()}`);
console.log();

const timeSavingsPositive = test1Result.totalMonths < standardMonths;
const netSavingsPositive = test1Result.netSavings > 0;
const helocInterestReasonable = test1Result.totalHelocInterest < test1Result.mortgageSavings;

console.log(`✓ Pays off faster: ${timeSavingsPositive ? 'PASS' : 'FAIL'}`);
console.log(`✓ Net savings positive: ${netSavingsPositive ? 'PASS' : 'FAIL'}`);
console.log(`✓ HELOC cost < mortgage savings: ${helocInterestReasonable ? 'PASS' : 'FAIL'}`);
console.log();

// Test Case 3: HELOC Paydown Logic
console.log('TEST 3: HELOC Paydown Verification');
console.log('-'.repeat(80));

const netCashflow = test1Params.monthlyIncome - test1Params.monthlyExpenses - test1Params.mortgagePayment;
console.log(`Net Monthly Cashflow: $${netCashflow.toLocaleString()}`);
console.log();

// Find first paydown cycle
const paydownCycle = test1Result.cycles.find(c => c.action === 'paydown');
if (paydownCycle) {
  console.log(`First Paydown Cycle (Month ${paydownCycle.month}):`);
  console.log(`  HELOC Balance Start: $${paydownCycle.helocBalance.toLocaleString()}`);
  console.log(`  HELOC Interest: $${paydownCycle.helocInterest.toFixed(2)}`);
  console.log(`  Cashflow Applied: $${paydownCycle.netCashflow.toLocaleString()}`);
  console.log();
}

// Check that HELOC gets paid down between cycles
const pullCycles = test1Result.cycles.filter(c => c.action === 'pull');
console.log(`Total HELOC Pull Cycles: ${pullCycles.length}`);

let helocPaidDownBetweenCycles = false;
for (let i = 1; i < pullCycles.length; i++) {
  const prevCycleIndex = test1Result.cycles.indexOf(pullCycles[i - 1]);
  const currentCycleIndex = test1Result.cycles.indexOf(pullCycles[i]);

  // Check cycles between pulls
  for (let j = prevCycleIndex + 1; j < currentCycleIndex; j++) {
    if (test1Result.cycles[j].helocBalance < 100) {
      helocPaidDownBetweenCycles = true;
      break;
    }
  }
  if (helocPaidDownBetweenCycles) break;
}

console.log(`✓ HELOC paid down between cycles: ${helocPaidDownBetweenCycles ? 'PASS' : 'FAIL'}`);
console.log();

// Summary
console.log('='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));

const allTestsPass =
  balanceMatch &&
  timeSavingsPositive &&
  netSavingsPositive &&
  helocInterestReasonable &&
  helocPaidDownBetweenCycles;

console.log();
if (allTestsPass) {
  console.log('✅ ALL TESTS PASSED - Calculations are mathematically accurate');
} else {
  console.log('❌ SOME TESTS FAILED - Review calculations');
}
console.log();
