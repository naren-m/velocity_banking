import { Request, Response } from 'express';
import { HelocService } from '../services/helocService';
import { HelocVelocityService } from '../services/helocVelocityService';
import { OptimalStrategyService } from '../services/optimalStrategyService';
import { MortgageService } from '../services/mortgageService';
import { z } from 'zod';

const helocService = new HelocService();
const helocVelocityService = new HelocVelocityService();
const optimalStrategyService = new OptimalStrategyService();
const mortgageService = new MortgageService();

const createHelocSchema = z.object({
  mortgageId: z.string(),
  creditLimit: z.number().positive(),
  currentBalance: z.number().min(0),
  interestRate: z.number().positive(),
  minimumPayment: z.number().positive(),
});

const calculateStrategySchema = z.object({
  mortgageId: z.string(),
  chunkAmount: z.number().positive(),
});

const calculateStrategiesForTargetYearSchema = z.object({
  mortgageId: z.string(),
  targetYears: z.number().positive().int(),
});

export const createHeloc = async (req: Request, res: Response) => {
  try {
    const data = createHelocSchema.parse(req.body);
    const heloc = await helocService.createHeloc(data);
    res.status(201).json(heloc);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getHelocByMortgage = async (req: Request, res: Response) => {
  try {
    const { mortgageId } = req.params;
    const heloc = await helocService.getHelocByMortgage(mortgageId);

    if (!heloc) {
      res.status(404).json({ error: 'HELOC not found' });
      return;
    }

    res.json(heloc);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const calculateHelocStrategy = async (req: Request, res: Response) => {
  try {
    const data = calculateStrategySchema.parse(req.body);
    const mortgage = await mortgageService.getMortgage(data.mortgageId);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    const heloc = await helocService.getHelocByMortgage(data.mortgageId);

    if (!heloc) {
      res.status(404).json({ error: 'HELOC not found. Please add HELOC details first.' });
      return;
    }

    if (!mortgage.monthlyIncome || !mortgage.monthlyExpenses) {
      res.status(400).json({ error: 'Monthly income and expenses required for HELOC strategy' });
      return;
    }

    // Validate strategy is viable
    const validation = helocVelocityService.validateHelocStrategy({
      mortgageBalance: mortgage.currentBalance,
      mortgageRate: mortgage.interestRate,
      mortgagePayment: mortgage.monthlyPayment,
      helocLimit: heloc.creditLimit,
      helocRate: heloc.interestRate,
      monthlyIncome: mortgage.monthlyIncome,
      monthlyExpenses: mortgage.monthlyExpenses,
      chunkAmount: data.chunkAmount,
    });

    if (!validation.isViable) {
      res.status(400).json({ error: validation.reason });
      return;
    }

    const strategy = helocVelocityService.calculateHelocStrategy({
      mortgageBalance: mortgage.currentBalance,
      mortgageRate: mortgage.interestRate,
      mortgagePayment: mortgage.monthlyPayment,
      helocLimit: heloc.creditLimit,
      helocRate: heloc.interestRate,
      monthlyIncome: mortgage.monthlyIncome,
      monthlyExpenses: mortgage.monthlyExpenses,
      chunkAmount: data.chunkAmount,
    });

    res.json(strategy);
  } catch (error) {
    console.error('Error calculating HELOC strategy:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateHeloc = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const heloc = await helocService.updateHeloc(id, data);

    if (!heloc) {
      res.status(404).json({ error: 'HELOC not found' });
      return;
    }

    res.json(heloc);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const calculateOptimalStrategies = async (req: Request, res: Response) => {
  try {
    const { mortgageId } = req.body;

    const mortgage = await mortgageService.getMortgage(mortgageId);
    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    const heloc = await helocService.getHelocByMortgage(mortgageId);
    if (!heloc) {
      res.status(404).json({ error: 'HELOC not found' });
      return;
    }

    if (!mortgage.monthlyIncome || !mortgage.monthlyExpenses) {
      res.status(400).json({ error: 'Monthly income and expenses required' });
      return;
    }

    const result = optimalStrategyService.generateQuickScenarios({
      mortgageBalance: mortgage.currentBalance,
      mortgageRate: mortgage.interestRate,
      mortgagePayment: mortgage.monthlyPayment,
      helocLimit: heloc.creditLimit,
      helocRate: heloc.interestRate,
      monthlyIncome: mortgage.monthlyIncome,
      monthlyExpenses: mortgage.monthlyExpenses,
    });

    res.json(result);
  } catch (error) {
    console.error('Error calculating optimal strategies:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const calculateStrategiesForTargetYear = async (req: Request, res: Response) => {
  try {
    const data = calculateStrategiesForTargetYearSchema.parse(req.body);

    const mortgage = await mortgageService.getMortgage(data.mortgageId);
    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    const heloc = await helocService.getHelocByMortgage(data.mortgageId);
    if (!heloc) {
      res.status(404).json({ error: 'HELOC not found' });
      return;
    }

    if (!mortgage.monthlyIncome || !mortgage.monthlyExpenses) {
      res.status(400).json({ error: 'Monthly income and expenses required' });
      return;
    }

    const result = optimalStrategyService.generateStrategiesForTargetYear({
      mortgageBalance: mortgage.currentBalance,
      mortgageRate: mortgage.interestRate,
      mortgagePayment: mortgage.monthlyPayment,
      helocLimit: heloc.creditLimit,
      helocRate: heloc.interestRate,
      monthlyIncome: mortgage.monthlyIncome,
      monthlyExpenses: mortgage.monthlyExpenses,
      targetYears: data.targetYears,
    });

    res.json(result);
  } catch (error) {
    console.error('Error calculating strategies for target year:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
