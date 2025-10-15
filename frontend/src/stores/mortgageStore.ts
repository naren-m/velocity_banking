import { create } from 'zustand';
import { Mortgage, ComparisonResult, Payment, Heloc, HelocStrategy } from '../types';
import { mortgageApi, calculationApi, paymentApi, helocApi } from '../services/api';

interface MortgageStore {
  mortgage: Mortgage | null;
  mortgages: Mortgage[];
  heloc: Heloc | null;
  comparison: ComparisonResult | null;
  helocStrategy: HelocStrategy | null;
  payments: Payment[];
  loading: boolean;
  error: string | null;

  // Actions
  setMortgage: (mortgage: Mortgage) => void;
  fetchMortgage: (id: string) => Promise<void>;
  fetchMortgagesByUser: (userId: string) => Promise<void>;
  createMortgage: (data: {
    userId: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    monthlyPayment: number;
    startDate: string;
    termMonths: number;
    monthlyIncome?: number;
    monthlyExpenses?: number;
  }) => Promise<Mortgage>;
  createHeloc: (data: {
    mortgageId: string;
    creditLimit: number;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
  }) => Promise<Heloc>;
  fetchHeloc: (mortgageId: string) => Promise<void>;
  calculateHelocStrategy: (chunkAmount: number) => Promise<void>;
  compareScenarios: (chunkAmount: number, frequency: 'monthly' | 'quarterly' | 'annual') => Promise<void>;
  makePayment: (amount: number, paymentType: 'regular' | 'chunk' | 'extra') => Promise<void>;
  fetchPayments: () => Promise<void>;
  clearError: () => void;
}

export const useMortgageStore = create<MortgageStore>((set, get) => ({
  mortgage: null,
  mortgages: [],
  heloc: null,
  comparison: null,
  helocStrategy: null,
  payments: [],
  loading: false,
  error: null,

  setMortgage: (mortgage) => set({ mortgage }),

  fetchMortgage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const mortgage = await mortgageApi.get(id);
      set({ mortgage, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchMortgagesByUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/mortgages/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mortgages');
      }
      const rawMortgages = await response.json();

      // Transform snake_case to camelCase
      const mortgages = rawMortgages.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        principal: m.principal,
        currentBalance: m.current_balance,
        interestRate: m.interest_rate,
        monthlyPayment: m.monthly_payment,
        startDate: m.start_date,
        termMonths: m.term_months,
        monthlyIncome: m.monthly_income,
        monthlyExpenses: m.monthly_expenses,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));

      // Set the first mortgage as active if we have any
      if (mortgages.length > 0) {
        set({ mortgages, mortgage: mortgages[0], loading: false });
      } else {
        set({ mortgages, loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createMortgage: async (data) => {
    set({ loading: true, error: null });
    try {
      const mortgage = await mortgageApi.create(data);
      set({ mortgage, loading: false });
      return mortgage;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  compareScenarios: async (chunkAmount, frequency) => {
    const { mortgage } = get();
    if (!mortgage) {
      set({ error: 'No mortgage loaded' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const comparison = await calculationApi.compare({
        mortgageId: mortgage.id,
        chunkAmount,
        frequency,
      });
      set({ comparison, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  makePayment: async (amount, paymentType) => {
    const { mortgage } = get();
    if (!mortgage) {
      set({ error: 'No mortgage loaded' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const payment = await paymentApi.create({
        mortgageId: mortgage.id,
        amount,
        paymentType,
      });

      // Update mortgage with new balance
      const updatedMortgage = await mortgageApi.get(mortgage.id);
      set({
        mortgage: updatedMortgage,
        payments: [payment, ...get().payments],
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPayments: async () => {
    const { mortgage } = get();
    if (!mortgage) return;

    set({ loading: true, error: null });
    try {
      const payments = await paymentApi.getHistory(mortgage.id);
      set({ payments, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createHeloc: async (data) => {
    set({ loading: true, error: null });
    try {
      const heloc = await helocApi.create(data);
      set({ heloc, loading: false });
      return heloc;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  fetchHeloc: async (mortgageId: string) => {
    set({ loading: true, error: null });
    try {
      const heloc = await helocApi.getByMortgage(mortgageId);
      set({ heloc, loading: false });
    } catch (error) {
      set({ heloc: null, loading: false });
    }
  },

  calculateHelocStrategy: async (chunkAmount: number) => {
    const { mortgage } = get();
    if (!mortgage) {
      set({ error: 'No mortgage loaded' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const helocStrategy = await helocApi.calculateStrategy({
        mortgageId: mortgage.id,
        chunkAmount,
      });
      set({ helocStrategy, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
