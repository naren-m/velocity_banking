import {
  AmortizationEntry,
  AmortizationSchedule,
  VelocityScenario,
  OptimalChunkResult,
  OptimalChunkScenario,
  SavingsAnalysis,
  Mortgage,
} from '../utils/types';

export class CalculationService {
  /**
   * Calculate monthly payment for a loan
   */
  calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / months;

    const payment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  }

  /**
   * Generate standard amortization schedule
   */
  calculateAmortization(
    principal: number,
    annualRate: number,
    monthlyPayment: number
  ): AmortizationSchedule {
    const schedule: AmortizationEntry[] = [];
    let balance = principal;
    const monthlyRate = annualRate / 12 / 100;
    let month = 0;
    let totalInterest = 0;

    while (balance > 0.01 && month < 360) {
      month++;
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
      balance -= principalPayment;
      totalInterest += interestPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    return {
      schedule,
      totalMonths: month,
      totalInterest,
      totalPaid: totalInterest + principal,
    };
  }

  /**
   * Calculate velocity banking scenario with chunk payments
   */
  calculateVelocityScenario(
    mortgage: Mortgage,
    chunkAmount: number,
    frequency: 'monthly' | 'quarterly' | 'annual'
  ): VelocityScenario {
    const schedule: AmortizationEntry[] = [];
    let balance = mortgage.currentBalance;
    const monthlyRate = mortgage.interestRate / 12 / 100;
    const monthsPerChunk = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12;
    let month = 0;
    let totalInterest = 0;
    let totalChunkPayments = 0;

    while (balance > 0.01 && month < 360) {
      month++;

      // Apply chunk payment at intervals
      if (month % monthsPerChunk === 0 && chunkAmount > 0) {
        const chunkToApply = Math.min(chunkAmount, balance);
        balance -= chunkToApply;
        totalChunkPayments += chunkToApply;

        if (balance <= 0.01) {
          schedule.push({
            month,
            payment: chunkToApply,
            principal: chunkToApply,
            interest: 0,
            balance: 0,
            chunkApplied: chunkToApply,
          });
          break;
        }
      }

      // Regular monthly payment
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(
        mortgage.monthlyPayment - interestPayment,
        balance
      );
      balance -= principalPayment;
      totalInterest += interestPayment;

      schedule.push({
        month,
        payment: mortgage.monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        chunkApplied: month % monthsPerChunk === 0 ? chunkAmount : 0,
      });
    }

    return {
      schedule,
      totalMonths: month,
      totalInterest,
      totalChunkPayments,
    };
  }

  /**
   * Calculate optimal chunk payment amount
   */
  calculateOptimalChunk(
    mortgage: Mortgage,
    availableLOC: number,
    monthlyIncome: number,
    monthlyExpenses: number
  ): OptimalChunkResult {
    const monthlyNetCashflow = monthlyIncome - monthlyExpenses;

    // Conservative approach: use 80% of available LOC
    const maxSafeChunk = availableLOC * 0.8;

    // Ensure we can replenish LOC within 3 months
    const repayableChunk = monthlyNetCashflow * 3;

    // Use the smaller of the two for safety
    const recommendedChunk = Math.min(maxSafeChunk, repayableChunk);

    // Calculate scenarios with different chunk amounts
    const scenarios: OptimalChunkScenario[] = [0.5, 0.75, 1.0].map((multiplier) => {
      const testChunk = recommendedChunk * multiplier;
      const scenario = this.calculateVelocityScenario(mortgage, testChunk, 'monthly');

      return {
        chunkAmount: testChunk,
        monthsToPayoff: scenario.totalMonths,
        totalInterest: scenario.totalInterest,
        monthlyCashflowImpact: testChunk / 3,
      };
    });

    return {
      recommendedChunk,
      scenarios,
      assumptions: {
        availableLOC,
        monthlyNetCashflow,
        repaymentPeriodMonths: 3,
      },
    };
  }

  /**
   * Calculate interest and time savings
   */
  calculateSavings(
    standardScenario: AmortizationSchedule,
    velocityScenario: VelocityScenario
  ): SavingsAnalysis {
    const interestSaved = standardScenario.totalInterest - velocityScenario.totalInterest;
    const monthsSaved = standardScenario.totalMonths - velocityScenario.totalMonths;
    const percentageSaved = (interestSaved / standardScenario.totalInterest) * 100;

    return {
      interestSaved,
      monthsSaved,
      percentageSaved,
    };
  }
}
