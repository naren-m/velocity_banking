import { db } from '../models/db';
import { mortgages, payments, users } from '../models/schema';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';

export interface UserActivityMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
}

export interface CalculationMetrics {
  totalCalculations: number;
  avgSavingsAmount: number;
  avgPayoffReduction: number;
  popularStrategies: { strategy: string; count: number }[];
}

export interface PaymentMetrics {
  totalPayments: number;
  totalAmountPaid: number;
  avgPaymentAmount: number;
  paymentTypeDistribution: { type: string; count: number; totalAmount: number }[];
}

export interface SystemHealthMetrics {
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeConnections: number;
  databaseSize: number;
}

export interface PerformanceMetrics {
  avgCalculationTime: number;
  avgApiResponseTime: number;
  peakUsageHours: number[];
  slowestEndpoints: { endpoint: string; avgTime: number }[];
}

export class AnalyticsService {
  // User Activity Analytics
  async getUserActivityMetrics(startDate?: Date, endDate?: Date): Promise<UserActivityMetrics> {
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Active users (made a payment in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsersResult = await db
      .select({ count: sql<number>`count(distinct ${payments.mortgageId})` })
      .from(payments)
      .where(gte(payments.paymentDate, thirtyDaysAgo));
    const activeUsers = Number(activeUsersResult[0]?.count || 0);

    // New users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, firstDayOfMonth));
    const newUsersThisMonth = Number(newUsersResult[0]?.count || 0);

    // Calculate growth rate
    const userGrowthRate = totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100,
    };
  }

  // Payment Analytics
  async getPaymentMetrics(startDate?: Date, endDate?: Date): Promise<PaymentMetrics> {
    const conditions = [];
    if (startDate) {
      conditions.push(gte(payments.paymentDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(payments.paymentDate, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total payments and amount
    const totalResult = await db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(whereClause);

    const totalPayments = Number(totalResult[0]?.count || 0);
    const totalAmountPaid = Number(totalResult[0]?.total || 0);
    const avgPaymentAmount = totalPayments > 0 ? totalAmountPaid / totalPayments : 0;

    // Payment type distribution
    const distributionResult = await db
      .select({
        type: payments.paymentType,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(whereClause)
      .groupBy(payments.paymentType);

    const paymentTypeDistribution = distributionResult.map((row) => ({
      type: row.type,
      count: Number(row.count),
      totalAmount: Number(row.totalAmount),
    }));

    return {
      totalPayments,
      totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
      avgPaymentAmount: Math.round(avgPaymentAmount * 100) / 100,
      paymentTypeDistribution,
    };
  }

  // Mortgage Analytics
  async getMortgageMetrics() {
    const totalMortgagesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mortgages);
    const totalMortgages = Number(totalMortgagesResult[0]?.count || 0);

    const avgBalanceResult = await db
      .select({
        avgBalance: sql<number>`avg(${mortgages.currentBalance})`,
        avgRate: sql<number>`avg(${mortgages.interestRate})`,
      })
      .from(mortgages);

    return {
      totalMortgages,
      avgCurrentBalance: Math.round((Number(avgBalanceResult[0]?.avgBalance) || 0) * 100) / 100,
      avgInterestRate: Math.round((Number(avgBalanceResult[0]?.avgRate) || 0) * 100) / 100,
    };
  }

  // Recent Activity
  async getRecentActivity(limit: number = 10) {
    const recentPayments = await db
      .select({
        id: payments.id,
        mortgageId: payments.mortgageId,
        amount: payments.amount,
        type: payments.paymentType,
        paymentDate: payments.paymentDate,
      })
      .from(payments)
      .orderBy(desc(payments.paymentDate))
      .limit(limit);

    return recentPayments;
  }

  // Time-series data for charts
  async getPaymentTimeSeries(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`date(${payments.paymentDate}, 'unixepoch')`,
        count: sql<number>`count(*)`,
        total: sql<number>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(gte(payments.paymentDate, startDate))
      .groupBy(sql`date(${payments.paymentDate}, 'unixepoch')`)
      .orderBy(sql`date(${payments.paymentDate}, 'unixepoch')`);

    return result.map((row) => ({
      date: row.date,
      count: Number(row.count),
      total: Math.round(Number(row.total) * 100) / 100,
    }));
  }

  // Aggregate dashboard metrics
  async getDashboardMetrics() {
    const [userMetrics, paymentMetrics, mortgageMetrics] = await Promise.all([
      this.getUserActivityMetrics(),
      this.getPaymentMetrics(),
      this.getMortgageMetrics(),
    ]);

    return {
      users: userMetrics,
      payments: paymentMetrics,
      mortgages: mortgageMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  // Performance tracking
  async trackApiCall(endpoint: string, responseTime: number, statusCode: number) {
    // In a production system, this would write to a time-series database
    // For now, we'll log it
    console.log(`[Analytics] ${endpoint} - ${responseTime}ms - ${statusCode}`);
  }

  // Error tracking
  async trackError(endpoint: string, errorMessage: string, errorType: string) {
    // In production, this would write to error tracking service
    console.error(`[Analytics] Error on ${endpoint}: ${errorType} - ${errorMessage}`);
  }
}

export const analyticsService = new AnalyticsService();
