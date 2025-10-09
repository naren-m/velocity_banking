import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { z } from 'zod';

const paymentService = new PaymentService();

const createPaymentSchema = z.object({
  mortgageId: z.string(),
  amount: z.number().positive(),
  paymentType: z.enum(['regular', 'chunk', 'extra']),
});

export const createPayment = async (req: Request, res: Response) => {
  try {
    const data = createPaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(data);
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { mortgageId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const payments = await paymentService.getPaymentHistory(mortgageId, limit);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPayment(id);

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTotalPaid = async (req: Request, res: Response) => {
  try {
    const { mortgageId } = req.params;
    const totals = await paymentService.getTotalPaid(mortgageId);
    res.json(totals);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
