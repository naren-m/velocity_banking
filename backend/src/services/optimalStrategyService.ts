import { HelocVelocityService, HelocCycleEntry } from './helocVelocityService';

export interface StrategyScenario {
  targetMonths: number;
  targetYears: number;
  chunkAmount: number;
  actualMonths: number;
  totalCycles: number;
  totalHelocInterest: number;
  totalMortgageInterest: number;
  totalInterest: number;
  netSavings: number;
  monthlyCashflowRequired: number;
  isViable: boolean;
  notes?: string;
  cycles?: HelocCycleEntry[];
}

export interface OptimalStrategyResult {
  scenarios: StrategyScenario[];
  recommended: StrategyScenario;
  parameters: {
    mortgageBalance: number;
    mortgageRate: number;
    mortgagePayment: number;
    helocLimit: number;
    helocRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netCashflow: number;
  };
}

export class OptimalStrategyService {
  private helocVelocityService: HelocVelocityService;

  constructor() {
    this.helocVelocityService = new HelocVelocityService();
  }

  /**
   * Calculates optimal chunk amounts for different target payoff times
   */
  calculateOptimalStrategies(params: {
    mortgageBalance: number;
    mortgageRate: number;
    mortgagePayment: number;
    helocLimit: number;
    helocRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    targetYears: number[];
  }): OptimalStrategyResult {
    const netCashflow = params.monthlyIncome - params.monthlyExpenses - params.mortgagePayment;

    const scenarios: StrategyScenario[] = [];

    // For each target year, find the optimal chunk amount
    const seenChunks = new Set<number>();

    for (const targetYears of params.targetYears) {
      const targetMonths = targetYears * 12;

      // Binary search to find the chunk amount that gets us closest to target
      const optimalChunk = this.findOptimalChunkForTarget(
        params,
        targetMonths
      );

      if (optimalChunk) {
        // Skip duplicate chunk amounts - they produce the same result
        if (seenChunks.has(optimalChunk.chunkAmount)) {
          continue;
        }
        seenChunks.add(optimalChunk.chunkAmount);

        scenarios.push({
          targetMonths,
          targetYears,
          chunkAmount: optimalChunk.chunkAmount,
          actualMonths: optimalChunk.actualMonths,
          totalCycles: optimalChunk.totalCycles,
          totalHelocInterest: optimalChunk.totalHelocInterest,
          totalMortgageInterest: optimalChunk.totalMortgageInterest,
          totalInterest: optimalChunk.totalInterest,
          netSavings: optimalChunk.netSavings,
          monthlyCashflowRequired: netCashflow,
          isViable: optimalChunk.isViable,
          notes: optimalChunk.notes,
        });
      }
    }

    // Find the recommended scenario (best savings with reasonable cashflow)
    const recommended = this.selectRecommendedScenario(scenarios, netCashflow);

    return {
      scenarios,
      recommended,
      parameters: {
        mortgageBalance: params.mortgageBalance,
        mortgageRate: params.mortgageRate,
        mortgagePayment: params.mortgagePayment,
        helocLimit: params.helocLimit,
        helocRate: params.helocRate,
        monthlyIncome: params.monthlyIncome,
        monthlyExpenses: params.monthlyExpenses,
        netCashflow,
      },
    };
  }

  /**
   * Finds the optimal chunk amount to hit a target payoff time
   */
  private findOptimalChunkForTarget(
    params: {
      mortgageBalance: number;
      mortgageRate: number;
      mortgagePayment: number;
      helocLimit: number;
      helocRate: number;
      monthlyIncome: number;
      monthlyExpenses: number;
    },
    targetMonths: number
  ): StrategyScenario | null {
    const netCashflow = params.monthlyIncome - params.monthlyExpenses - params.mortgagePayment;

    // Binary search for optimal chunk amount
    let minChunk = 5000;
    let maxChunk = Math.min(params.helocLimit, params.mortgageBalance * 0.2);
    let bestChunk: StrategyScenario | null = null;
    let bestDifference = Infinity;

    const maxIterations = 20;
    let iterations = 0;

    while (minChunk <= maxChunk && iterations < maxIterations) {
      iterations++;
      const midChunk = Math.round((minChunk + maxChunk) / 2 / 1000) * 1000; // Round to nearest $1000

      try {
        const strategy = this.helocVelocityService.calculateHelocStrategy({
          mortgageBalance: params.mortgageBalance,
          mortgageRate: params.mortgageRate,
          mortgagePayment: params.mortgagePayment,
          helocLimit: params.helocLimit,
          helocRate: params.helocRate,
          monthlyIncome: params.monthlyIncome,
          monthlyExpenses: params.monthlyExpenses,
          chunkAmount: midChunk,
        });

        const difference = Math.abs(strategy.totalMonths - targetMonths);

        // Track the best result
        if (difference < bestDifference) {
          bestDifference = difference;
          bestChunk = {
            targetMonths,
            targetYears: targetMonths / 12,
            chunkAmount: midChunk,
            actualMonths: strategy.totalMonths,
            totalCycles: strategy.totalCycles,
            totalHelocInterest: strategy.totalHelocInterest,
            totalMortgageInterest: strategy.totalMortgageInterest,
            totalInterest: strategy.totalInterest,
            netSavings: strategy.netSavings,
            monthlyCashflowRequired: netCashflow,
            isViable: true,
            cycles: strategy.cycles,
          };
        }

        // Adjust search range
        if (strategy.totalMonths > targetMonths) {
          // Need more aggressive chunks
          minChunk = midChunk + 1000;
        } else {
          // Can use smaller chunks
          maxChunk = midChunk - 1000;
        }
      } catch (error) {
        // Strategy not viable with this chunk amount
        if (error instanceof Error && error.message.includes('cannot be paid down')) {
          // Chunk too large, reduce
          maxChunk = midChunk - 1000;
        } else {
          // Other error, try smaller chunk
          maxChunk = midChunk - 1000;
        }
      }
    }

    // If we couldn't find a viable strategy, note why
    if (!bestChunk) {
      return {
        targetMonths,
        targetYears: targetMonths / 12,
        chunkAmount: 0,
        actualMonths: 0,
        totalCycles: 0,
        totalHelocInterest: 0,
        totalMortgageInterest: 0,
        totalInterest: 0,
        netSavings: 0,
        monthlyCashflowRequired: netCashflow,
        isViable: false,
        notes: 'Target payoff time not achievable with current cashflow and HELOC limit',
      };
    }

    return bestChunk;
  }

  /**
   * Selects the recommended scenario based on multiple factors
   */
  private selectRecommendedScenario(
    scenarios: StrategyScenario[],
    netCashflow: number
  ): StrategyScenario {
    // Filter to viable scenarios only
    const viable = scenarios.filter(s => s.isViable);

    if (viable.length === 0) {
      return scenarios[0]; // Return first even if not viable
    }

    // Score each scenario based on:
    // - Net savings (higher is better)
    // - Reasonable timeline (7-15 years is optimal)
    // - Cashflow sustainability (not too aggressive)

    let bestScore = -Infinity;
    let recommended = viable[0];

    for (const scenario of viable) {
      let score = 0;

      // Savings score (normalize to 0-100)
      const savingsScore = Math.min(100, (scenario.netSavings / 100000) * 100);
      score += savingsScore * 0.4;

      // Timeline score (prefer 7-15 years)
      const years = scenario.actualMonths / 12;
      let timelineScore = 0;
      if (years >= 7 && years <= 15) {
        timelineScore = 100;
      } else if (years < 7) {
        timelineScore = 100 - ((7 - years) * 15); // Penalty for too aggressive
      } else {
        timelineScore = 100 - ((years - 15) * 10); // Penalty for too slow
      }
      score += Math.max(0, timelineScore) * 0.4;

      // Cashflow sustainability score
      const cashflowScore = 100; // All viable scenarios have positive cashflow
      score += cashflowScore * 0.2;

      if (score > bestScore) {
        bestScore = score;
        recommended = scenario;
      }
    }

    return recommended;
  }

  /**
   * Generates optimized scenarios with intelligent chunk/period combinations
   * Uses mathematical optimization to find the best 5 scenarios
   */
  generateQuickScenarios(params: {
    mortgageBalance: number;
    mortgageRate: number;
    mortgagePayment: number;
    helocLimit: number;
    helocRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  }): OptimalStrategyResult {
    const netCashflow = params.monthlyIncome - params.monthlyExpenses - params.mortgagePayment;

    // Calculate standard payoff time without HELOC
    const standardMonths = this.calculateStandardPayoffTime(
      params.mortgageBalance,
      params.mortgageRate,
      params.mortgagePayment
    );
    const standardYears = Math.ceil(standardMonths / 12);

    // Generate intelligent target years based on standard payoff
    // Goal: Show meaningful acceleration options
    const targetYears: number[] = [];

    if (standardYears > 20) {
      // For 30-year mortgages, show: 12, 10, 8, 6, 5 years
      targetYears.push(12, 10, 8, 6, 5);
    } else if (standardYears > 10) {
      // For 15-20 year mortgages, show: 10, 8, 6, 5, 4 years
      targetYears.push(10, 8, 6, 5, 4);
    } else {
      // For shorter mortgages, show reasonable acceleration
      const max = Math.floor(standardYears * 0.8);
      const min = Math.max(3, Math.floor(standardYears * 0.3));
      const step = Math.max(1, Math.floor((max - min) / 4));
      for (let y = max; y >= min && targetYears.length < 5; y -= step) {
        targetYears.push(y);
      }
    }

    // Ensure we have exactly 5 unique scenarios
    const uniqueYears = [...new Set(targetYears)].slice(0, 5);
    while (uniqueYears.length < 5) {
      const lastYear = uniqueYears[uniqueYears.length - 1];
      const newYear = Math.max(3, lastYear - 1);
      if (!uniqueYears.includes(newYear)) {
        uniqueYears.push(newYear);
      } else {
        break;
      }
    }

    return this.calculateOptimalStrategies({
      ...params,
      targetYears: uniqueYears.sort((a, b) => b - a),
    });
  }

  /**
   * Calculates standard payoff time without velocity banking
   */
  private calculateStandardPayoffTime(
    balance: number,
    annualRate: number,
    monthlyPayment: number
  ): number {
    const monthlyRate = annualRate / 12 / 100;

    if (monthlyRate === 0) {
      return Math.ceil(balance / monthlyPayment);
    }

    // Use amortization formula: n = -log(1 - (r*P)/M) / log(1 + r)
    // where P = principal, M = monthly payment, r = monthly rate
    const numerator = Math.log(1 - (monthlyRate * balance) / monthlyPayment);
    const denominator = Math.log(1 + monthlyRate);

    return Math.ceil(-numerator / denominator);
  }

  /**
   * Generates multiple chunk amount strategies for a specific target payoff year
   * Provides conservative, moderate, and aggressive options
   */
  generateStrategiesForTargetYear(params: {
    mortgageBalance: number;
    mortgageRate: number;
    mortgagePayment: number;
    helocLimit: number;
    helocRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    targetYears: number;
  }): OptimalStrategyResult {
    const targetMonths = params.targetYears * 12;
    const netCashflow = params.monthlyIncome - params.monthlyExpenses - params.mortgagePayment;

    // Find the optimal chunk for the exact target
    const optimalChunk = this.findOptimalChunkForTarget(params, targetMonths);

    if (!optimalChunk || !optimalChunk.isViable) {
      // Target not achievable, return empty result with explanation
      return {
        scenarios: [],
        recommended: {
          targetMonths,
          targetYears: params.targetYears,
          chunkAmount: 0,
          actualMonths: 0,
          totalCycles: 0,
          totalHelocInterest: 0,
          totalMortgageInterest: 0,
          totalInterest: 0,
          netSavings: 0,
          monthlyCashflowRequired: netCashflow,
          isViable: false,
          notes: `Target of ${params.targetYears} years not achievable with current cashflow and HELOC limit`,
        },
        parameters: {
          mortgageBalance: params.mortgageBalance,
          mortgageRate: params.mortgageRate,
          mortgagePayment: params.mortgagePayment,
          helocLimit: params.helocLimit,
          helocRate: params.helocRate,
          monthlyIncome: params.monthlyIncome,
          monthlyExpenses: params.monthlyExpenses,
          netCashflow,
        },
      };
    }

    // Generate variations with smaller chunks included
    const scenarios: StrategyScenario[] = [];
    const baseChunk = optimalChunk.chunkAmount;

    // Generate chunk variations: 40%, 60%, 80%, 100%, 120%, 140%
    const chunkVariations = [
      { multiplier: 0.4, label: 'Ultra-small chunks - Minimal risk, slowest payoff' },
      { multiplier: 0.6, label: 'Very conservative - Lowest standard risk, longest timeline' },
      { multiplier: 0.8, label: 'Conservative approach - Lower chunk, more time' },
      { multiplier: 1.0, label: 'Optimal approach - Best balance of speed and savings' },
      { multiplier: 1.2, label: 'Aggressive approach - Higher chunk, faster payoff' },
      { multiplier: 1.4, label: 'Very aggressive - Highest chunk, fastest payoff' },
    ];

    for (const { multiplier, label} of chunkVariations) {
      const chunk = Math.round(baseChunk * multiplier / 1000) * 1000;

      // Skip if chunk is too small or exceeds HELOC limit
      if (chunk < 5000 || chunk > params.helocLimit) {
        continue;
      }

      // Skip duplicates
      if (scenarios.some(s => s.chunkAmount === chunk)) {
        continue;
      }

      try {
        const strategy = this.helocVelocityService.calculateHelocStrategy({
          ...params,
          chunkAmount: chunk,
        });

        scenarios.push({
          targetMonths,
          targetYears: params.targetYears,
          chunkAmount: chunk,
          actualMonths: strategy.totalMonths,
          totalCycles: strategy.totalCycles,
          totalHelocInterest: strategy.totalHelocInterest,
          totalMortgageInterest: strategy.totalMortgageInterest,
          totalInterest: strategy.totalInterest,
          netSavings: strategy.netSavings,
          monthlyCashflowRequired: netCashflow,
          isViable: true,
          notes: label,
          cycles: strategy.cycles, // Include month-by-month breakdown
        });
      } catch (error) {
        // Skip if not viable
      }

      // Limit to 10 strategies max
      if (scenarios.length >= 10) {
        break;
      }
    }

    // Sort by chunk amount (ascending)
    scenarios.sort((a, b) => a.chunkAmount - b.chunkAmount);

    // Recommended is the optimal (moderate) one
    const recommended = scenarios.find(s => s.notes?.includes('Optimal')) || scenarios[0];

    return {
      scenarios,
      recommended,
      parameters: {
        mortgageBalance: params.mortgageBalance,
        mortgageRate: params.mortgageRate,
        mortgagePayment: params.mortgagePayment,
        helocLimit: params.helocLimit,
        helocRate: params.helocRate,
        monthlyIncome: params.monthlyIncome,
        monthlyExpenses: params.monthlyExpenses,
        netCashflow,
      },
    };
  }
}
