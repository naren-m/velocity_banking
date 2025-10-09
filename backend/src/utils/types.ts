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

export interface SavingsAnalysis {
  interestSaved: number;
  monthsSaved: number;
  percentageSaved: number;
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
  monthlyIncome?: number | null;
  monthlyExpenses?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStrategy {
  id: string;
  mortgageId: string;
  strategyType: 'standard' | 'velocity' | 'custom';
  chunkAmount: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  projectedMonthsToPayoff: number;
  totalInterestSaved: number;
  createdAt: Date;
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
