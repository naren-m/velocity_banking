export interface User {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  createdAt: Date;
}

export interface Mortgage {
  id: string;
  userId: string;
  principal: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: Date;
  termMonths: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Heloc {
  id: string;
  mortgageId: string;
  creditLimit: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  chunkApplied?: number;
}

export interface AmortizationSchedule {
  schedule: AmortizationEntry[];
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
}

export interface VelocityScenario {
  schedule: AmortizationEntry[];
  totalMonths: number;
  totalInterest: number;
  totalChunkPayments: number;
}

export interface SavingsAnalysis {
  interestSaved: number;
  monthsSaved: number;
  percentageSaved: number;
}

export interface ComparisonResult {
  standard: AmortizationSchedule;
  velocity: VelocityScenario;
  savings: SavingsAnalysis;
}

export interface Payment {
  id: string;
  mortgageId: string;
  amount: number;
  paymentDate: Date;
  paymentType: 'regular' | 'chunk' | 'extra';
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface OptimalChunkScenario {
  chunkAmount: number;
  monthsToPayoff: number;
  totalInterest: number;
  monthlyCashflowImpact: number;
}

export interface OptimalChunkResult {
  recommendedChunk: number;
  scenarios: OptimalChunkScenario[];
  assumptions: {
    availableLOC: number;
    monthlyNetCashflow: number;
    repaymentPeriodMonths: number;
  };
}

export interface StrategyScenario {
  targetMonths: number;
  targetYears: number;
  chunkAmount: number;
  actualMonths: number;
  totalCycles: number;
  totalHelocInterest: number;
  totalMortgageInterest: number;
  totalInterest: number;
  netSavings: number;
  monthlyCashflowRequired: number;
  isViable: boolean;
  notes?: string;
  cycles?: HelocCycleEntry[];
}

export interface OptimalStrategyResult {
  scenarios: StrategyScenario[];
  recommended: StrategyScenario;
  parameters: {
    mortgageBalance: number;
    mortgageRate: number;
    mortgagePayment: number;
    helocLimit: number;
    helocRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netCashflow: number;
  };
}
