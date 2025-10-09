import { db } from '../models/db';
import { helocs } from '../models/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface HelocData {
  mortgageId: string;
  creditLimit: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
}

export class HelocService {
  async createHeloc(data: HelocData) {
    const now = Date.now();
    const heloc = {
      id: randomUUID(),
      mortgageId: data.mortgageId,
      creditLimit: data.creditLimit,
      currentBalance: data.currentBalance,
      interestRate: data.interestRate,
      minimumPayment: data.minimumPayment,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    await db.insert(helocs).values(heloc);
    return heloc;
  }

  async getHelocByMortgage(mortgageId: string) {
    const result = await db.select().from(helocs).where(eq(helocs.mortgageId, mortgageId)).limit(1);
    return result[0] || null;
  }

  async updateHeloc(id: string, data: Partial<HelocData>) {
    const updates = {
      ...data,
      updatedAt: new Date(),
    };

    await db.update(helocs).set(updates).where(eq(helocs.id, id));
    return this.getHeloc(id);
  }

  async getHeloc(id: string) {
    const result = await db.select().from(helocs).where(eq(helocs.id, id)).limit(1);
    return result[0] || null;
  }

  async deleteHeloc(id: string) {
    await db.delete(helocs).where(eq(helocs.id, id));
  }
}
