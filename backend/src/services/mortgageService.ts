import { db } from '../models/db';
import { mortgages } from '../models/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Mortgage } from '../utils/types';

export class MortgageService {
  async createMortgage(data: {
    userId: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    monthlyPayment: number;
    startDate: Date;
    termMonths: number;
    monthlyIncome?: number;
    monthlyExpenses?: number;
  }): Promise<Mortgage> {
    const now = new Date();

    console.log('DEBUG: Incoming data:', {
      monthlyIncome: data.monthlyIncome,
      monthlyExpenses: data.monthlyExpenses,
      hasIncome: !!data.monthlyIncome,
      hasExpenses: !!data.monthlyExpenses
    });

    const mortgage = {
      id: randomUUID(),
      userId: data.userId,
      principal: data.principal,
      currentBalance: data.currentBalance,
      interestRate: data.interestRate,
      monthlyPayment: data.monthlyPayment,
      startDate: data.startDate,
      termMonths: data.termMonths,
      monthlyIncome: data.monthlyIncome || null,
      monthlyExpenses: data.monthlyExpenses || null,
      createdAt: now,
      updatedAt: now,
    };

    console.log('DEBUG: Mortgage object to insert:', {
      id: mortgage.id,
      monthlyIncome: mortgage.monthlyIncome,
      monthlyExpenses: mortgage.monthlyExpenses
    });

    await db.insert(mortgages).values(mortgage);

    console.log('DEBUG: Insertion complete, retrieving from DB...');
    const saved = await db.select().from(mortgages).where(eq(mortgages.id, mortgage.id)).limit(1);
    console.log('DEBUG: Saved mortgage from DB:', {
      id: saved[0]?.id,
      monthlyIncome: saved[0]?.monthlyIncome,
      monthlyExpenses: saved[0]?.monthlyExpenses
    });

    return mortgage;
  }

  async getMortgage(id: string): Promise<Mortgage | null> {
    const result = await db.select().from(mortgages).where(eq(mortgages.id, id)).limit(1);
    return result[0] || null;
  }

  async getMortgagesByUser(userId: string): Promise<Mortgage[]> {
    return await db.select().from(mortgages).where(eq(mortgages.userId, userId));
  }

  async updateMortgage(
    id: string,
    data: Partial<{
      currentBalance: number;
      monthlyPayment: number;
      interestRate: number;
    }>
  ): Promise<Mortgage | null> {
    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };

    await db.update(mortgages).set(updatedData).where(eq(mortgages.id, id));
    return this.getMortgage(id);
  }

  async deleteMortgage(id: string): Promise<boolean> {
    await db.delete(mortgages).where(eq(mortgages.id, id));
    return true;
  }
}
