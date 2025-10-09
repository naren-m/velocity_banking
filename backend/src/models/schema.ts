import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique(),
  email: text('email').unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const mortgages = sqliteTable('mortgages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  principal: real('principal').notNull(),
  currentBalance: real('current_balance').notNull(),
  interestRate: real('interest_rate').notNull(),
  monthlyPayment: real('monthly_payment').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  termMonths: integer('term_months').notNull(),
  monthlyIncome: real('monthly_income'),
  monthlyExpenses: real('monthly_expenses'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const helocs = sqliteTable('helocs', {
  id: text('id').primaryKey(),
  mortgageId: text('mortgage_id').notNull().references(() => mortgages.id),
  creditLimit: real('credit_limit').notNull(),
  currentBalance: real('current_balance').notNull(),
  interestRate: real('interest_rate').notNull(),
  minimumPayment: real('minimum_payment').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const paymentStrategies = sqliteTable('payment_strategies', {
  id: text('id').primaryKey(),
  mortgageId: text('mortgage_id').notNull().references(() => mortgages.id),
  strategyType: text('strategy_type', { enum: ['standard', 'velocity', 'custom'] }).notNull(),
  chunkAmount: real('chunk_amount').notNull(),
  frequency: text('frequency', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  projectedMonthsToPayoff: integer('projected_months_to_payoff').notNull(),
  totalInterestSaved: real('total_interest_saved').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  mortgageId: text('mortgage_id').notNull().references(() => mortgages.id),
  amount: real('amount').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  paymentType: text('payment_type', { enum: ['regular', 'chunk', 'extra'] }).notNull(),
  principalPaid: real('principal_paid').notNull(),
  interestPaid: real('interest_paid').notNull(),
  remainingBalance: real('remaining_balance').notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
