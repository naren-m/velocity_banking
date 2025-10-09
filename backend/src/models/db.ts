import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { mkdirSync } from 'fs';

// Ensure data directory exists
try {
  mkdirSync('/app/data', { recursive: true });
} catch (err) {
  // Directory might already exist
}

const sqlite = new Database('/app/data/velocity-banking.db');
export const db = drizzle(sqlite, { schema });

// Initialize database with tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      name TEXT,
      password_hash TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mortgages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      principal REAL NOT NULL,
      current_balance REAL NOT NULL,
      interest_rate REAL NOT NULL,
      monthly_payment REAL NOT NULL,
      start_date INTEGER NOT NULL,
      term_months INTEGER NOT NULL,
      monthly_income REAL,
      monthly_expenses REAL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS helocs (
      id TEXT PRIMARY KEY,
      mortgage_id TEXT NOT NULL,
      credit_limit REAL NOT NULL,
      current_balance REAL NOT NULL,
      interest_rate REAL NOT NULL,
      minimum_payment REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (mortgage_id) REFERENCES mortgages(id)
    );

    CREATE TABLE IF NOT EXISTS payment_strategies (
      id TEXT PRIMARY KEY,
      mortgage_id TEXT NOT NULL,
      strategy_type TEXT NOT NULL CHECK(strategy_type IN ('standard', 'velocity', 'custom')),
      chunk_amount REAL NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('monthly', 'quarterly', 'annual')),
      projected_months_to_payoff INTEGER NOT NULL,
      total_interest_saved REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (mortgage_id) REFERENCES mortgages(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      mortgage_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date INTEGER NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('regular', 'chunk', 'extra')),
      principal_paid REAL NOT NULL,
      interest_paid REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (mortgage_id) REFERENCES mortgages(id)
    );
  `);

  // Create demo user if it doesn't exist
  try {
    sqlite.exec(`
      INSERT OR IGNORE INTO users (id, email, name, created_at)
      VALUES ('demo-user', 'demo@example.com', 'Demo User', ${Date.now()});
    `);
  } catch (err) {
    console.error('Error creating demo user:', err);
  }

  console.log('Database initialized successfully');
}
