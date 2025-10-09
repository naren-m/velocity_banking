export interface HelocCycleEntry {
  month: number;
  action: 'pull' | 'paydown' | 'complete';
  helocPull: number;
  mortgagePayment: number;
  mortgageBalance: number;
  helocBalance: number;
  incomeDeposit: number;
  expensesPaid: number;
  helocInterest: number;
  netCashflow: number;
  description: string;
}

export interface HelocStrategy {
  cycles: HelocCycleEntry[];
  totalCycles: number;
  totalMonths: number;
  totalHelocInterest: number;
  totalMortgageInterest: number;
  totalInterest: number;
  mortgageSavings: number;
  helocCost: number;
  netSavings: number;
}

export interface HelocVelocityParams {
  mortgageBalance: number;
  mortgageRate: number;
  mortgagePayment: number;
  helocLimit: number;
  helocRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  chunkAmount: number;
}

export class HelocVelocityService {
  /**
   * Calculates a complete HELOC velocity banking strategy
   * Shows month-by-month how HELOC is used to pay mortgage and then paid down
   */
  calculateHelocStrategy(params: HelocVelocityParams): HelocStrategy {
    const {
      mortgageBalance: initialMortgageBalance,
      mortgageRate,
      mortgagePayment,
      helocLimit,
      helocRate,
      monthlyIncome,
      monthlyExpenses,
      chunkAmount,
    } = params;

    const cycles: HelocCycleEntry[] = [];
    let mortgageBalance = initialMortgageBalance;
    let helocBalance = 0;
    let totalHelocInterest = 0;
    let totalMortgageInterest = 0;
    let month = 0;
    let cycleCount = 0;

    const monthlyMortgageRate = mortgageRate / 12 / 100;
    const monthlyHelocRate = helocRate / 12 / 100;
    const netMonthlyCashflow = monthlyIncome - monthlyExpenses - mortgagePayment;

    // Validate that we have positive cashflow
    if (netMonthlyCashflow <= 0) {
      throw new Error('Monthly income must exceed expenses + mortgage payment for velocity banking to work');
    }

    // Validate chunk amount is available
    if (chunkAmount > helocLimit) {
      throw new Error('Chunk amount cannot exceed HELOC credit limit');
    }

    while (mortgageBalance > 0 && cycleCount < 1000) { // Safety limit
      cycleCount++;

      // MONTH 1 of cycle: Pull from HELOC and pay chunk to mortgage
      month++;
      const actualChunk = Math.min(chunkAmount, mortgageBalance, helocLimit - helocBalance);

      if (actualChunk < 100) break; // Can't make meaningful progress

      // Calculate interest on BEGINNING balance (before any payments)
      const mortgageInterestThisMonth = mortgageBalance * monthlyMortgageRate;
      totalMortgageInterest += mortgageInterestThisMonth;

      // Apply regular mortgage payment first
      const regularPrincipal = mortgagePayment - mortgageInterestThisMonth;
      mortgageBalance -= regularPrincipal;

      // Then apply chunk payment from HELOC
      const effectiveChunk = Math.min(actualChunk, mortgageBalance);
      helocBalance += effectiveChunk;
      mortgageBalance -= effectiveChunk;

      cycles.push({
        month,
        action: 'pull',
        helocPull: effectiveChunk,
        mortgagePayment: mortgagePayment + effectiveChunk, // Regular payment + chunk
        mortgageBalance: Math.max(0, mortgageBalance),
        helocBalance,
        incomeDeposit: 0,
        expensesPaid: 0,
        helocInterest: 0,
        netCashflow: 0,
        description: `Regular payment + pull $${effectiveChunk.toFixed(2)} from HELOC for chunk payment`,
      });

      // Now pay down HELOC using cashflow until it's clear or mortgage is paid off
      let helocPaydownMonths = 0;
      while (helocBalance > 1 && mortgageBalance > 0) {
        month++;
        helocPaydownMonths++;

        // Calculate HELOC interest for this month
        const helocInterestThisMonth = helocBalance * monthlyHelocRate;
        totalHelocInterest += helocInterestThisMonth;

        // Add interest to HELOC balance
        helocBalance += helocInterestThisMonth;

        // Pay regular mortgage payment
        const mortgageInterest = mortgageBalance * monthlyMortgageRate;
        const mortgagePrincipal = mortgagePayment - mortgageInterest;
        mortgageBalance -= mortgagePrincipal;
        totalMortgageInterest += mortgageInterest;

        // Use net cashflow to pay down HELOC
        const helocPayment = Math.min(netMonthlyCashflow, helocBalance);
        helocBalance -= helocPayment;

        cycles.push({
          month,
          action: 'paydown',
          helocPull: 0,
          mortgagePayment: mortgagePayment,
          mortgageBalance: Math.max(0, mortgageBalance),
          helocBalance: Math.max(0, helocBalance),
          incomeDeposit: monthlyIncome,
          expensesPaid: monthlyExpenses + mortgagePayment,
          helocInterest: helocInterestThisMonth,
          netCashflow: helocPayment,
          description: `Pay down HELOC with net cashflow ($${netMonthlyCashflow.toFixed(2)}/mo)`,
        });

        // Safety check for HELOC paydown
        if (helocPaydownMonths > 100) {
          throw new Error('HELOC cannot be paid down with current cashflow. Reduce chunk amount or increase income.');
        }
      }
    }

    // Final month - mortgage paid off
    if (mortgageBalance <= 0) {
      cycles.push({
        month: month + 1,
        action: 'complete',
        helocPull: 0,
        mortgagePayment: 0,
        mortgageBalance: 0,
        helocBalance: 0,
        incomeDeposit: 0,
        expensesPaid: 0,
        helocInterest: 0,
        netCashflow: 0,
        description: 'Mortgage paid off! 🎉',
      });
    }

    // Calculate standard mortgage interest for comparison
    const standardMonths = this.calculateStandardPayoffMonths(
      initialMortgageBalance,
      monthlyMortgageRate,
      mortgagePayment
    );
    const standardTotalInterest = this.calculateStandardInterest(
      initialMortgageBalance,
      monthlyMortgageRate,
      mortgagePayment
    );

    const totalInterest = totalMortgageInterest + totalHelocInterest;
    const mortgageSavings = standardTotalInterest - totalMortgageInterest;
    const netSavings = standardTotalInterest - totalInterest;

    return {
      cycles,
      totalCycles: cycleCount,
      totalMonths: month,
      totalHelocInterest,
      totalMortgageInterest,
      totalInterest,
      mortgageSavings,
      helocCost: totalHelocInterest,
      netSavings,
    };
  }

  private calculateStandardPayoffMonths(balance: number, monthlyRate: number, payment: number): number {
    if (monthlyRate === 0) return Math.ceil(balance / payment);
    return Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
    );
  }

  private calculateStandardInterest(balance: number, monthlyRate: number, payment: number): number {
    let remaining = balance;
    let totalInterest = 0;

    while (remaining > 0) {
      const interest = remaining * monthlyRate;
      totalInterest += interest;
      const principal = payment - interest;
      remaining -= principal;
    }

    return totalInterest;
  }

  /**
   * Validates if HELOC velocity banking is viable with given parameters
   */
  validateHelocStrategy(params: HelocVelocityParams): { isViable: boolean; reason?: string } {
    const { monthlyIncome, monthlyExpenses, mortgagePayment, chunkAmount, helocLimit } = params;

    const netCashflow = monthlyIncome - monthlyExpenses - mortgagePayment;

    if (netCashflow <= 0) {
      return {
        isViable: false,
        reason: 'Monthly income must exceed expenses + mortgage payment',
      };
    }

    if (chunkAmount > helocLimit) {
      return {
        isViable: false,
        reason: 'Chunk amount exceeds HELOC credit limit',
      };
    }

    if (chunkAmount < 1000) {
      return {
        isViable: false,
        reason: 'Chunk amount should be at least $1,000 for meaningful impact',
      };
    }

    return { isViable: true };
  }
}
