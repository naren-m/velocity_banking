import { Request, Response } from 'express';
import { z } from 'zod';
import { InvestmentComparisonService } from '../services/investmentComparisonService';

const investmentComparisonService = new InvestmentComparisonService();

const compareInvestmentSchema = z.object({
  mortgagePrincipal: z.number().positive(),
  mortgageBalance: z.number().positive(),
  mortgageRate: z.number().min(0).max(30),
  mortgagePayment: z.number().positive(),
  termMonths: z.number().int().positive(),
  monthlyInvestmentAmount: z.number().positive(),
  averageMarketReturn: z.number().min(0).max(100),
});

export const compareInvestmentScenarios = async (req: Request, res: Response) => {
  try {
    const data = compareInvestmentSchema.parse(req.body);

    const result = investmentComparisonService.compareScenarios(data);

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error in compareInvestmentScenarios:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
