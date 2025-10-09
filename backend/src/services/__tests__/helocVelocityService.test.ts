import { HelocVelocityService } from '../helocVelocityService';

describe('HelocVelocityService - Mathematical Accuracy', () => {
  let service: HelocVelocityService;

  beforeEach(() => {
    service = new HelocVelocityService();
  });

  describe('Interest Calculation Accuracy', () => {
    test('should calculate interest on beginning balance, not ending balance', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0, // 6% annual
        mortgagePayment: 1799, // Standard payment for 300k @ 6% for 30 years
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        chunkAmount: 10000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // First cycle should have:
      // Month 1: Interest on $300,000 = 300000 * 0.06/12 = $1,500
      // Regular payment: $1,799 (interest: $1,500, principal: $299)
      // Balance after regular payment: $299,701
      // Then chunk of $10,000 applied
      // Final balance: $289,701

      const firstCycle = strategy.cycles[0];
      expect(firstCycle.action).toBe('pull');
      expect(firstCycle.mortgageBalance).toBeCloseTo(289701, 0);
    });

    test('should include regular mortgage payment in chunk month', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0,
        mortgagePayment: 1799,
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        chunkAmount: 10000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // First month payment should be regular payment + chunk
      const firstCycle = strategy.cycles[0];
      expect(firstCycle.mortgagePayment).toBeGreaterThan(10000);
      expect(firstCycle.mortgagePayment).toBeLessThan(12000);
    });

    test('should correctly calculate total mortgage interest', () => {
      const params = {
        mortgageBalance: 100000,
        mortgageRate: 6.0,
        mortgagePayment: 600,
        helocLimit: 20000,
        helocRate: 8.0,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        chunkAmount: 10000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // Total interest should be positive and reasonable
      expect(strategy.totalMortgageInterest).toBeGreaterThan(0);
      expect(strategy.totalInterest).toBeGreaterThan(0);

      // Total interest should be less than without velocity banking
      // (This is the whole point of the strategy)
      const standardMonths = Math.ceil(
        -Math.log(1 - (0.06/12 * 100000) / 600) / Math.log(1 + 0.06/12)
      );
      expect(strategy.totalMonths).toBeLessThan(standardMonths);
    });

    test('should have positive net savings', () => {
      const params = {
        mortgageBalance: 200000,
        mortgageRate: 6.0,
        mortgagePayment: 1200,
        helocLimit: 40000,
        helocRate: 7.5,
        monthlyIncome: 7000,
        monthlyExpenses: 4000,
        chunkAmount: 15000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // Net savings should be positive
      // (Standard interest - (Mortgage interest + HELOC interest))
      expect(strategy.netSavings).toBeGreaterThan(0);

      // HELOC interest should be less than the mortgage savings
      expect(strategy.totalHelocInterest).toBeLessThan(strategy.mortgageSavings);
    });
  });

  describe('Payoff Time Calculation', () => {
    test('should pay off mortgage faster with chunks', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0,
        mortgagePayment: 1799,
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        chunkAmount: 15000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // Should pay off in significantly less than 30 years (360 months)
      expect(strategy.totalMonths).toBeLessThan(360);

      // With $15k chunks and good cashflow, should be under 15 years
      expect(strategy.totalMonths).toBeLessThan(180);
    });

    test('should handle edge case of final payment', () => {
      const params = {
        mortgageBalance: 5000, // Small balance
        mortgageRate: 6.0,
        mortgagePayment: 500,
        helocLimit: 10000,
        helocRate: 8.0,
        monthlyIncome: 3000,
        monthlyExpenses: 1500,
        chunkAmount: 5000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // Should complete quickly
      expect(strategy.totalMonths).toBeLessThan(24);

      // Should have a completion entry
      const lastCycle = strategy.cycles[strategy.cycles.length - 1];
      expect(lastCycle.action).toBe('complete');
      expect(lastCycle.mortgageBalance).toBe(0);
    });
  });

  describe('HELOC Balance Management', () => {
    test('should pay down HELOC before next chunk', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0,
        mortgagePayment: 1799,
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        chunkAmount: 10000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // Find first paydown cycle after first pull
      const pullCycles = strategy.cycles.filter(c => c.action === 'pull');

      // Should have multiple pull cycles
      expect(pullCycles.length).toBeGreaterThan(1);

      // Between pulls, HELOC should be paid down
      // Check that HELOC balance goes back to 0 or near 0 between cycles
      let foundPaydown = false;
      for (let i = 1; i < strategy.cycles.length; i++) {
        if (strategy.cycles[i].action === 'pull' && strategy.cycles[i - 1].helocBalance < 100) {
          foundPaydown = true;
          break;
        }
      }
      expect(foundPaydown).toBe(true);
    });

    test('should accumulate HELOC interest during paydown', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0,
        mortgagePayment: 1799,
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        chunkAmount: 10000,
      };

      const strategy = service.calculateHelocStrategy(params);

      // Should have positive HELOC interest
      expect(strategy.totalHelocInterest).toBeGreaterThan(0);

      // HELOC interest should be reasonable (not more than 20% of chunk amounts used)
      const totalChunksUsed = strategy.totalCycles * 10000;
      expect(strategy.totalHelocInterest).toBeLessThan(totalChunksUsed * 0.2);
    });
  });

  describe('Validation', () => {
    test('should reject strategy with insufficient cashflow', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0,
        mortgagePayment: 1799,
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 2000, // Not enough
        monthlyExpenses: 1500,
        chunkAmount: 10000,
      };

      expect(() => {
        service.calculateHelocStrategy(params);
      }).toThrow('Monthly income must exceed expenses + mortgage payment');
    });

    test('should reject chunk exceeding HELOC limit', () => {
      const params = {
        mortgageBalance: 300000,
        mortgageRate: 6.0,
        mortgagePayment: 1799,
        helocLimit: 50000,
        helocRate: 8.0,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        chunkAmount: 60000, // Too large
      };

      expect(() => {
        service.calculateHelocStrategy(params);
      }).toThrow('Chunk amount cannot exceed HELOC credit limit');
    });
  });
});
