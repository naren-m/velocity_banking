import { Request, Response } from 'express';
import { MortgageService } from '../services/mortgageService';
import { CalculationService } from '../services/calculationService';
import { z } from 'zod';

const mortgageService = new MortgageService();
const calculationService = new CalculationService();

const createMortgageSchema = z.object({
  userId: z.string(),
  principal: z.number().positive(),
  currentBalance: z.number().positive(),
  interestRate: z.number().positive(),
  monthlyPayment: z.number().positive(),
  startDate: z.string().transform((val) => new Date(val)),
  termMonths: z.number().int().positive(),
  monthlyIncome: z.number().positive().optional(),
  monthlyExpenses: z.number().positive().optional(),
});

const updateMortgageSchema = z.object({
  currentBalance: z.number().positive().optional(),
  monthlyPayment: z.number().positive().optional(),
  interestRate: z.number().positive().optional(),
});

export const createMortgage = async (req: Request, res: Response) => {
  try {
    console.log('Received mortgage creation request:', req.body);
    const data = createMortgageSchema.parse(req.body);
    console.log('Validation passed, creating mortgage...');
    const mortgage = await mortgageService.createMortgage(data);
    console.log('Mortgage created successfully:', mortgage.id);
    res.status(201).json(mortgage);
  } catch (error) {
    console.error('Error in createMortgage:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export const getMortgage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mortgage = await mortgageService.getMortgage(id);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    res.json(mortgage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMortgage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateMortgageSchema.parse(req.body);
    const mortgage = await mortgageService.updateMortgage(id, data);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    res.json(mortgage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteMortgage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await mortgageService.deleteMortgage(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMortgagesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const mortgages = await mortgageService.getMortgagesByUser(userId);
    res.json(mortgages);
  } catch (error) {
    console.error('Error in getMortgagesByUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAmortization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mortgage = await mortgageService.getMortgage(id);

    if (!mortgage) {
      res.status(404).json({ error: 'Mortgage not found' });
      return;
    }

    const schedule = calculationService.calculateAmortization(
      mortgage.currentBalance,
      mortgage.interestRate,
      mortgage.monthlyPayment
    );

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
