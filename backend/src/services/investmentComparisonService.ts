/**
 * Investment Comparison Service
 * Compares mortgage payoff strategies against stock market investment
 */

export interface InvestmentScenario {
  month: number;
  investmentBalance: number;
  investmentContribution: number;
  investmentReturns: number;
  mortgageBalance?: number;
  mortgageInterestPaid?: number;
  totalInvested: number;
  netWorth: number;
}

export interface InvestmentComparisonResult {
  scenario1: {
    name: string;
    description: string;
    schedule: InvestmentScenario[];
    totalMonths: number;
    totalInvested: number;
    finalInvestmentValue: number;
    totalReturns: number;
    mortgageInterestPaid: number;
    netWorth: number;
  };
  scenario2: {
    name: string;
    description: string;
    schedule: InvestmentScenario[];
    totalMonths: number;
    totalInvested: number;
    finalInvestmentValue: number;
    totalReturns: number;
    mortgageInterestPaid: number;
    payoffMonth: number;
    netWorth: number;
  };
  comparison: {
    netWorthDifference: number;
    betterScenario: 'scenario1' | 'scenario2';
    returnDifference: number;
    interestSavings: number;
  };
}

export interface InvestmentComparisonInput {
  mortgagePrincipal: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgagePayment: number;
  termMonths: number;
  monthlyInvestmentAmount: number;
  averageMarketReturn: number; // Annual return rate as percentage
}

export class InvestmentComparisonService {
  /**
   * Calculate compound interest for investment
   */
  private calculateCompoundReturns(
    principal: number,
    monthlyContribution: number,
    annualRate: number,
    months: number
  ): number {
    const monthlyRate = annualRate / 12 / 100;
    let balance = principal;

    for (let i = 0; i < months; i++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }

    return balance;
  }

  /**
   * Scenario 1: Don't pay off loan, invest for the entire loan period
   * Invest monthly amount into stock market while continuing mortgage payments
   */
  private calculateScenario1(input: InvestmentComparisonInput): InvestmentScenario[] {
    const {
      mortgageBalance,
      mortgageRate,
      mortgagePayment,
      termMonths,
      monthlyInvestmentAmount,
      averageMarketReturn,
    } = input;

    const schedule: InvestmentScenario[] = [];
    const monthlyRate = mortgageRate / 12 / 100;
    const investmentMonthlyRate = averageMarketReturn / 12 / 100;

    let currentMortgageBalance = mortgageBalance;
    let investmentBalance = 0;
    let totalInvested = 0;
    let totalMortgageInterest = 0;

    for (let month = 1; month <= termMonths; month++) {
      // Calculate mortgage interest and principal
      const interestPayment = currentMortgageBalance * monthlyRate;
      const principalPayment = mortgagePayment - interestPayment;
      currentMortgageBalance -= principalPayment;
      totalMortgageInterest += interestPayment;

      // Investment grows with market returns
      const investmentReturns = investmentBalance * investmentMonthlyRate;
      investmentBalance += monthlyInvestmentAmount + investmentReturns;
      totalInvested += monthlyInvestmentAmount;

      // Net worth = investment - mortgage debt
      const netWorth = investmentBalance - Math.max(0, currentMortgageBalance);

      schedule.push({
        month,
        investmentBalance,
        investmentContribution: monthlyInvestmentAmount,
        investmentReturns,
        mortgageBalance: Math.max(0, currentMortgageBalance),
        mortgageInterestPaid: interestPayment,
        totalInvested,
        netWorth,
      });

      if (currentMortgageBalance <= 0) {
        break;
      }
    }

    return schedule;
  }

  /**
   * Scenario 2: Pay off loan first, then invest
   * Use monthly amount to pay extra principal, then invest after payoff
   */
  private calculateScenario2(input: InvestmentComparisonInput): InvestmentScenario[] {
    const {
      mortgageBalance,
      mortgageRate,
      mortgagePayment,
      termMonths,
      monthlyInvestmentAmount,
      averageMarketReturn,
    } = input;

    const schedule: InvestmentScenario[] = [];
    const monthlyRate = mortgageRate / 12 / 100;
    const investmentMonthlyRate = averageMarketReturn / 12 / 100;

    let currentMortgageBalance = mortgageBalance;
    let investmentBalance = 0;
    let totalInvested = 0;
    let totalMortgageInterest = 0;
    let payoffMonth = 0;
    let mortgagePaidOff = false;

    for (let month = 1; month <= termMonths; month++) {
      if (!mortgagePaidOff) {
        // Pay extra towards mortgage principal
        const interestPayment = currentMortgageBalance * monthlyRate;
        const principalPayment = mortgagePayment - interestPayment + monthlyInvestmentAmount;
        currentMortgageBalance -= principalPayment;
        totalMortgageInterest += interestPayment;

        if (currentMortgageBalance <= 0) {
          mortgagePaidOff = true;
          payoffMonth = month;
          currentMortgageBalance = 0;
        }

        schedule.push({
          month,
          investmentBalance: 0,
          investmentContribution: 0,
          investmentReturns: 0,
          mortgageBalance: Math.max(0, currentMortgageBalance),
          mortgageInterestPaid: interestPayment,
          totalInvested: 0,
          netWorth: -Math.max(0, currentMortgageBalance),
        });
      } else {
        // Mortgage paid off, now invest full payment + extra amount
        const monthlyInvestment = mortgagePayment + monthlyInvestmentAmount;
        const investmentReturns = investmentBalance * investmentMonthlyRate;
        investmentBalance += monthlyInvestment + investmentReturns;
        totalInvested += monthlyInvestment;

        schedule.push({
          month,
          investmentBalance,
          investmentContribution: monthlyInvestment,
          investmentReturns,
          mortgageBalance: 0,
          mortgageInterestPaid: 0,
          totalInvested,
          netWorth: investmentBalance,
        });
      }
    }

    return schedule;
  }

  /**
   * Compare both investment scenarios
   */
  compareScenarios(input: InvestmentComparisonInput): InvestmentComparisonResult {
    const scenario1Schedule = this.calculateScenario1(input);
    const scenario2Schedule = this.calculateScenario2(input);

    const scenario1Final = scenario1Schedule[scenario1Schedule.length - 1];
    const scenario2Final = scenario2Schedule[scenario2Schedule.length - 1];

    const scenario1MortgageInterest = scenario1Schedule.reduce(
      (sum, entry) => sum + (entry.mortgageInterestPaid || 0),
      0
    );

    const scenario2MortgageInterest = scenario2Schedule.reduce(
      (sum, entry) => sum + (entry.mortgageInterestPaid || 0),
      0
    );

    const payoffMonth = scenario2Schedule.findIndex((entry) => entry.mortgageBalance === 0) + 1;

    const scenario1Returns = scenario1Final.investmentBalance - scenario1Final.totalInvested;
    const scenario2Returns = scenario2Final.investmentBalance - scenario2Final.totalInvested;

    const netWorthDifference = scenario2Final.netWorth - scenario1Final.netWorth;
    const betterScenario = netWorthDifference > 0 ? 'scenario2' : 'scenario1';

    return {
      scenario1: {
        name: 'Invest While Paying Mortgage',
        description: 'Continue mortgage payments and invest extra funds in the market',
        schedule: scenario1Schedule,
        totalMonths: scenario1Schedule.length,
        totalInvested: scenario1Final.totalInvested,
        finalInvestmentValue: scenario1Final.investmentBalance,
        totalReturns: scenario1Returns,
        mortgageInterestPaid: scenario1MortgageInterest,
        netWorth: scenario1Final.netWorth,
      },
      scenario2: {
        name: 'Pay Off Mortgage First',
        description: 'Pay extra towards mortgage, then invest after payoff',
        schedule: scenario2Schedule,
        totalMonths: scenario2Schedule.length,
        totalInvested: scenario2Final.totalInvested,
        finalInvestmentValue: scenario2Final.investmentBalance,
        totalReturns: scenario2Returns,
        mortgageInterestPaid: scenario2MortgageInterest,
        payoffMonth,
        netWorth: scenario2Final.netWorth,
      },
      comparison: {
        netWorthDifference,
        betterScenario,
        returnDifference: scenario2Returns - scenario1Returns,
        interestSavings: scenario1MortgageInterest - scenario2MortgageInterest,
      },
    };
  }
}
