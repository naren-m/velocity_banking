import { db } from '../models/db';
import { payments } from '../models/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Payment, Mortgage } from '../utils/types';
import { MortgageService } from './mortgageService';

export class PaymentService {
  private mortgageService: MortgageService;

  constructor() {
    this.mortgageService = new MortgageService();
  }

  async createPayment(data: {
    mortgageId: string;
    amount: number;
    paymentType: 'regular' | 'chunk' | 'extra';
  }): Promise<Payment> {
    const mortgage = await this.mortgageService.getMortgage(data.mortgageId);
    if (!mortgage) {
      throw new Error('Mortgage not found');
    }

    // Calculate interest and principal portions
    const monthlyRate = mortgage.interestRate / 12 / 100;
    const interestPaid = mortgage.currentBalance * monthlyRate;
    const principalPaid = Math.min(data.amount - interestPaid, mortgage.currentBalance);
    const remainingBalance = Math.max(0, mortgage.currentBalance - principalPaid);

    const now = new Date();
    const payment: Payment = {
      id: randomUUID(),
      mortgageId: data.mortgageId,
      amount: data.amount,
      paymentDate: now,
      paymentType: data.paymentType,
      principalPaid,
      interestPaid,
      remainingBalance,
      status: 'completed',
      createdAt: now,
    };

    // Insert payment
    await db.insert(payments).values(payment);

    // Update mortgage balance
    await this.mortgageService.updateMortgage(data.mortgageId, {
      currentBalance: remainingBalance,
    });

    return payment;
  }

  async getPaymentHistory(mortgageId: string, limit: number = 50): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.mortgageId, mortgageId))
      .orderBy(desc(payments.paymentDate))
      .limit(limit);
  }

  async getPayment(id: string): Promise<Payment | null> {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0] || null;
  }

  async getTotalPaid(mortgageId: string): Promise<{
    totalPaid: number;
    totalPrincipal: number;
    totalInterest: number;
  }> {
    const paymentHistory = await this.getPaymentHistory(mortgageId, 1000);

    const totals = paymentHistory.reduce(
      (acc, payment) => ({
        totalPaid: acc.totalPaid + payment.amount,
        totalPrincipal: acc.totalPrincipal + payment.principalPaid,
        totalInterest: acc.totalInterest + payment.interestPaid,
      }),
      { totalPaid: 0, totalPrincipal: 0, totalInterest: 0 }
    );

    return totals;
  }
}
