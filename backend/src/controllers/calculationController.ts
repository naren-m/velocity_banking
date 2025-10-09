import { Request, Response } from 'express';
import { CalculationService } from '../services/calculationService';
import { MortgageService } from '../services/mortgageService';
import { z } from 'zod';

const calculationService = new CalculationService();
const mortgageService = new MortgageService();

const velocityScenarioSchema = z.object({
  mortgageId: z.string(),
  chunkAmount: z.number().positive(),
  frequency: z.enum(['monthly', 'quarterly', 'annual']),
});

const optimalChunkSchema = z.object({
  mortgageId: z.string(),
  availableLOC: z.number().positive(),
  monthlyIncome: z.number().positive(),
  monthlyExpenses: z.number().positive(),
});

const compareSchema = z.object({
  mortgageId: z.string(),
  chunkAmount: z.number().positive(),
  frequency: z.enum(['monthly', 'quarterly', 'annual']),
});

export const calculateVelocityScenario = async (req: Request, res: Response) => {
  try {
    const data = velocityScenarioSchema.parse(req.body);
    const mortgage = await mortgageService.getMortgage(data.mortgageId);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    const scenario = calculationService.calculateVelocityScenario(
      mortgage,
      data.chunkAmount,
      data.frequency
    );

    res.json(scenario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const calculateOptimalChunk = async (req: Request, res: Response) => {
  try {
    const data = optimalChunkSchema.parse(req.body);
    const mortgage = await mortgageService.getMortgage(data.mortgageId);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    const result = calculationService.calculateOptimalChunk(
      mortgage,
      data.availableLOC,
      data.monthlyIncome,
      data.monthlyExpenses
    );

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const compareScenarios = async (req: Request, res: Response) => {
  try {
    const data = compareSchema.parse(req.body);
    const mortgage = await mortgageService.getMortgage(data.mortgageId);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    // Calculate standard scenario
    const standardScenario = calculationService.calculateAmortization(
      mortgage.currentBalance,
      mortgage.interestRate,
      mortgage.monthlyPayment
    );

    // Calculate velocity scenario
    const velocityScenario = calculationService.calculateVelocityScenario(
      mortgage,
      data.chunkAmount,
      data.frequency
    );

    // Calculate savings
    const savings = calculationService.calculateSavings(standardScenario, velocityScenario);

    res.json({
      standard: standardScenario,
      velocity: velocityScenario,
      savings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
