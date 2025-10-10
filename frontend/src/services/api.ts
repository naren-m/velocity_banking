import {
  Mortgage,
  AmortizationSchedule,
  VelocityScenario,
  ComparisonResult,
  Payment,
  OptimalChunkResult,
  Heloc,
  HelocStrategy,
} from '../types';

const API_BASE = 'http://localhost:3001/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Mortgage API
export const mortgageApi = {
  create: async (data: {
    userId: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    monthlyPayment: number;
    startDate: string;
    termMonths: number;
  }): Promise<Mortgage> => {
    // Transform camelCase to snake_case for backend
    const payload = {
      user_id: data.userId,
      principal: data.principal,
      current_balance: data.currentBalance,
      interest_rate: data.interestRate,
      monthly_payment: data.monthlyPayment,
      start_date: data.startDate,
      term_months: data.termMonths,
    };
    const response = await fetch(`${API_BASE}/mortgages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  get: async (id: string): Promise<Mortgage> => {
    const response = await fetch(`${API_BASE}/mortgages/${id}`);
    return handleResponse(response);
  },

  update: async (
    id: string,
    data: Partial<{
      currentBalance: number;
      monthlyPayment: number;
      interestRate: number;
    }>
  ): Promise<Mortgage> => {
    const response = await fetch(`${API_BASE}/mortgages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/mortgages/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete mortgage');
    }
  },

  getAmortization: async (id: string): Promise<AmortizationSchedule> => {
    const response = await fetch(`${API_BASE}/mortgages/${id}/amortization`);
    return handleResponse(response);
  },
};

// Calculation API
export const calculationApi = {
  velocityScenario: async (data: {
    mortgageId: string;
    chunkAmount: number;
    frequency: 'monthly' | 'quarterly' | 'annual';
  }): Promise<VelocityScenario> => {
    const response = await fetch(`${API_BASE}/calculate/velocity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  optimalChunk: async (data: {
    mortgageId: string;
    availableLOC: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  }): Promise<OptimalChunkResult> => {
    const response = await fetch(`${API_BASE}/calculate/optimal-chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  compare: async (data: {
    mortgageId: string;
    chunkAmount: number;
    frequency: 'monthly' | 'quarterly' | 'annual';
  }): Promise<ComparisonResult> => {
    const response = await fetch(`${API_BASE}/calculate/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Payment API
export const paymentApi = {
  create: async (data: {
    mortgageId: string;
    amount: number;
    paymentType: 'regular' | 'chunk' | 'extra';
  }): Promise<Payment> => {
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getHistory: async (mortgageId: string, limit = 50): Promise<Payment[]> => {
    const response = await fetch(
      `${API_BASE}/payments/mortgage/${mortgageId}?limit=${limit}`
    );
    return handleResponse(response);
  },

  get: async (id: string): Promise<Payment> => {
    const response = await fetch(`${API_BASE}/payments/${id}`);
    return handleResponse(response);
  },

  getTotals: async (
    mortgageId: string
  ): Promise<{ totalPaid: number; totalPrincipal: number; totalInterest: number }> => {
    const response = await fetch(`${API_BASE}/payments/mortgage/${mortgageId}/totals`);
    return handleResponse(response);
  },
};

// HELOC API
export const helocApi = {
  create: async (data: {
    mortgageId: string;
    creditLimit: number;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
  }): Promise<Heloc> => {
    const response = await fetch(`${API_BASE}/helocs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getByMortgage: async (mortgageId: string): Promise<Heloc> => {
    const response = await fetch(`${API_BASE}/helocs/mortgage/${mortgageId}`);
    return handleResponse(response);
  },

  update: async (id: string, data: Partial<Heloc>): Promise<Heloc> => {
    const response = await fetch(`${API_BASE}/helocs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  calculateStrategy: async (data: {
    mortgageId: string;
    chunkAmount: number;
  }): Promise<HelocStrategy> => {
    const response = await fetch(`${API_BASE}/helocs/calculate-strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
